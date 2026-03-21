import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/express.d.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

const checkoutSchema = z.object({
  planId: z.enum(['sdk', 'accelerator', 'enterprise']),
  paymentMethod: z.string().optional(),
  courseId: z.string().uuid().optional(),
});

const withdrawSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is 10 USDC'),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  chain: z.string().min(1),
});

router.get('/plans', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = [
      {
        id: 'sdk',
        name: 'SDK',
        price: 397,
        currency: 'USD',
        interval: null,
        features: ['Agent SDK', '5h video', '3 templates', 'Community support'],
      },
      {
        id: 'accelerator',
        name: 'Accelerator',
        price: 25000,
        currency: 'USD',
        interval: null,
        features: [
          '12-week cohort',
          '1:1 mentorship',
          'Fine-tuning',
          'Cross-chain',
          'Peer network',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 150000,
        currency: 'USD',
        interval: 'year',
        features: [
          'TEE deployment',
          'zkTLS',
          'Dedicated support',
          'On-site retreat',
          'Custom tokenomics',
        ],
      },
    ];
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/checkout',
  authenticate,
  validateRequest(checkoutSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { planId, paymentMethod, courseId } = req.body;

      const planPrices: Record<string, number> = {
        sdk: 397,
        accelerator: 25000,
        enterprise: 150000,
      };

      const payment = await prisma.payment.create({
        data: {
          userId: req.user!.id,
          amount: planPrices[planId] || 0,
          currency: 'USD',
          type: 'subscription',
          status: 'PENDING',
        },
      });

      const checkoutBaseUrl = process.env.CHECKOUT_BASE_URL || 'https://checkout.kuberna.africa';
      res.status(201).json({
        paymentId: payment.id,
        checkoutUrl: `${checkoutBaseUrl}/${payment.id}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/balance',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { web3Address: true },
      });

      res.json({
        balances: [
          { chain: 'NEAR', amount: '0', usdValue: '0' },
          { chain: 'Ethereum', amount: '0', usdValue: '0' },
          { chain: 'Solana', amount: '0', usdValue: '0' },
        ],
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/transactions',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: { userId: req.user!.id },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where: { userId: req.user!.id } }),
      ]);

      res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/withdraw',
  authenticate,
  validateRequest(withdrawSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, address, chain } = req.body;

      const payment = await prisma.payment.create({
        data: {
          userId: req.user!.id,
          amount,
          currency: 'USDC',
          token: chain,
          type: 'withdrawal',
          status: 'PENDING',
        },
      });

      res.status(201).json({
        withdrawalId: payment.id,
        status: 'processing',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/webhook/stripe', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment_intent.succeeded') {
      const paymentId = data.object.metadata?.paymentId;
      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            txHash: data.object.id,
          },
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export const paymentRouter = router;
