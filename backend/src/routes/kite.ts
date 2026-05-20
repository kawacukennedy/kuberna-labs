import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { createError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types/express.d';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { kitePassportService } from '../services';
import logger from '../utils/logger';

const router = Router();

const connectWalletSchema = z.object({
  kiteWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Kite wallet address'),
});

const createSessionSchema = z.object({
  agentId: z.string().uuid(),
  taskSummary: z.string().min(1),
  maxAmountPerTx: z.number().positive(),
  maxTotalAmount: z.number().positive(),
  ttl: z.string().default('24h'),
});

router.post(
  '/wallet/connect',
  authenticate,
  validateRequest(connectWalletSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { kiteWalletAddress } = req.body;

      await kitePassportService.setUserKiteWallet(req.user!.id, kiteWalletAddress);

      res.json({
        success: true,
        data: { kiteWalletAddress },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/wallet',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { kiteWalletAddress: true },
      });

      if (!user?.kiteWalletAddress) {
        res.json({ success: true, data: { connected: false, kiteWalletAddress: null } });
        return;
      }

      let balances: Array<{ asset: string; amount: string; usdValue: string }> = [];
      try {
        const balanceData = await kitePassportService.getWalletBalance(user.kiteWalletAddress);
        balances = balanceData.balances;
      } catch {
        logger.warn('Could not fetch Kite wallet balance', { kiteWalletAddress: user.kiteWalletAddress });
      }

      res.json({
        success: true,
        data: {
          connected: true,
          kiteWalletAddress: user.kiteWalletAddress,
          balances,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/agents/register',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.body;

      const agent = await prisma.agent.findUnique({ where: { id: agentId } });

      if (!agent) {
        throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
      }

      if (agent.ownerId !== req.user!.id) {
        throw createError('Not authorized', 403, 'FORBIDDEN');
      }

      const kiteReg = await kitePassportService.registerKiteAgent(
        req.user!.id,
        agent.name,
        'coding-assistant'
      );

      await kitePassportService.updateAgentKiteInfo(agent.id, kiteReg);

      res.json({
        success: true,
        data: kiteReg,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/sessions/create',
  authenticate,
  validateRequest(createSessionSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { agentId, taskSummary, maxAmountPerTx, maxTotalAmount, ttl } = req.body;

      const agent = await prisma.agent.findUnique({ where: { id: agentId } });

      if (!agent) {
        throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
      }

      if (agent.ownerId !== req.user!.id) {
        throw createError('Not authorized', 403, 'FORBIDDEN');
      }

      if (!agent.kiteAgentDid) {
        throw createError('Agent not registered with Kite Passport', 400, 'KITE_NOT_REGISTERED');
      }

      const session = await kitePassportService.createSpendingSession(
        req.user!.id,
        agent.kiteAgentDid,
        {
          taskSummary,
          maxAmountPerTx,
          maxTotalAmount,
          ttl,
          assets: ['USDC'],
          paymentApproach: 'x402_http',
        }
      );

      await prisma.agent.update({
        where: { id: agentId },
        data: { kiteSessionId: session.sessionId },
      });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/sessions/:sessionId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      const sessionStatus = await kitePassportService.getSessionStatus(sessionId);

      res.json({
        success: true,
        data: sessionStatus,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/agents/:agentId/info',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { agentId } = req.params;

      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          kiteWalletAddress: true,
          kiteAgentDid: true,
          kiteSessionId: true,
        },
      });

      if (!agent) {
        throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
      }

      res.json({ success: true, data: agent });
    } catch (error) {
      next(error);
    }
  }
);

export const kiteRouter = router;
