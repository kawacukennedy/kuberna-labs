import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/express.d.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { intentLimiter } from '../middleware/rateLimiter.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const { status, sourceChain, destChain } = req.query;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (sourceChain) where.sourceChain = sourceChain;
    if (destChain) where.destChain = destChain;

    const [intents, total] = await Promise.all([
      prisma.intent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { bids: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.intent.count({ where }),
    ]);

    res.json({
      intents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const intent = await prisma.intent.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            profile: true,
          },
        },
        bids: {
          include: {
            agent: {
              include: {
                owner: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
                reputation: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        task: true,
      },
    });

    if (!intent) {
      throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
    }

    res.json(intent);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authenticate,
  intentLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        description,
        structuredData,
        sourceChain,
        sourceToken,
        sourceAmount,
        destChain,
        destToken,
        minDestAmount,
        deadline,
        budget,
        autoAcceptRules,
      } = req.body;

      const intent = await prisma.intent.create({
        data: {
          requesterId: req.user!.id,
          description,
          structuredData,
          sourceChain,
          sourceToken,
          sourceAmount,
          destChain,
          destToken,
          minDestAmount,
          deadline: new Date(deadline),
          budget,
          expiresAt: new Date(deadline),
          autoAcceptRules,
          status: 'OPEN',
        },
      });

      await prisma.notification.create({
        data: {
          userId: req.user!.id,
          type: 'INFO',
          title: 'Intent Created',
          message: `Your intent has been posted and is now visible to solvers.`,
        },
      });

      res.status(201).json(intent);
    } catch (error) {
      next(error);
    }
  }
);

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { description, sourceAmount, minDestAmount, deadline, budget, status, autoAcceptRules } =
      req.body;

    const intent = await prisma.intent.findUnique({ where: { id } });

    if (!intent) {
      throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
    }

    if (intent.requesterId !== req.user!.id) {
      throw createError('Not authorized to update this intent', 403, 'FORBIDDEN');
    }

    if (intent.status !== 'OPEN' && intent.status !== 'BIDDING') {
      throw createError('Cannot update intent in current status', 400, 'INVALID_STATUS');
    }

    const updatedIntent = await prisma.intent.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(sourceAmount && { sourceAmount }),
        ...(minDestAmount && { minDestAmount }),
        ...(deadline && {
          deadline: new Date(deadline),
          expiresAt: new Date(deadline),
        }),
        ...(budget !== undefined && { budget }),
        ...(status && { status }),
        ...(autoAcceptRules && { autoAcceptRules }),
      },
    });

    res.json(updatedIntent);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const intent = await prisma.intent.findUnique({ where: { id } });

    if (!intent) {
      throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
    }

    if (intent.requesterId !== req.user!.id && !req.user!.roles.includes('ADMIN')) {
      throw createError('Not authorized to delete this intent', 403, 'FORBIDDEN');
    }

    if (intent.status === 'ASSIGNED' || intent.status === 'EXECUTING') {
      throw createError(
        'Cannot delete intent that is currently being executed',
        400,
        'INVALID_STATUS'
      );
    }

    await prisma.intent.delete({ where: { id } });

    res.json({ message: 'Intent deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/bids',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { price, estimatedTime, routeDetails } = req.body;

      const intent = await prisma.intent.findUnique({
        where: { id },
        include: {
          bids: true,
        },
      });

      if (!intent) {
        throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
      }

      if (intent.status !== 'OPEN' && intent.status !== 'BIDDING') {
        throw createError('Cannot bid on intent in current status', 400, 'INVALID_STATUS');
      }

      const existingBid = intent.bids.find((bid) => bid.agentId === req.user!.id);
      if (existingBid) {
        throw createError('You have already placed a bid on this intent', 400, 'DUPLICATE_BID');
      }

      const agent = await prisma.agent.findFirst({
        where: {
          ownerId: req.user!.id,
          status: { in: ['DEPLOYED', 'RUNNING'] },
        },
      });

      if (!agent) {
        throw createError('You need a deployed agent to bid on intents', 400, 'NO_AGENT');
      }

      const bid = await prisma.bid.create({
        data: {
          intentId: id,
          agentId: agent.id,
          price,
          estimatedTime,
          routeDetails,
          status: 'PENDING',
        },
      });

      if (intent.status === 'OPEN') {
        await prisma.intent.update({
          where: { id },
          data: { status: 'BIDDING' },
        });
      }

      res.status(201).json(bid);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/bids/:bidId/accept',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, bidId } = req.params;

      const intent = await prisma.intent.findUnique({
        where: { id },
        include: {
          bids: true,
        },
      });

      if (!intent) {
        throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
      }

      if (intent.requesterId !== req.user!.id) {
        throw createError('Only the requester can accept bids', 403, 'FORBIDDEN');
      }

      const bid = intent.bids.find((b) => b.id === bidId);
      if (!bid) {
        throw createError('Bid not found', 404, 'BID_NOT_FOUND');
      }

      if (bid.status !== 'PENDING') {
        throw createError('Bid is no longer available', 400, 'INVALID_STATUS');
      }

      await prisma.$transaction([
        prisma.bid.update({
          where: { id: bidId },
          data: { status: 'ACCEPTED' },
        }),
        prisma.bid.updateMany({
          where: {
            intentId: id,
            id: { not: bidId },
            status: 'PENDING',
          },
          data: { status: 'REJECTED' },
        }),
        prisma.intent.update({
          where: { id },
          data: {
            status: 'ASSIGNED',
            selectedSolverId: bid.agentId,
          },
        }),
        prisma.task.create({
          data: {
            intentId: id,
            assignedAgentId: bid.agentId,
            status: 'ASSIGNED',
          },
        }),
      ]);

      await prisma.notification.create({
        data: {
          userId: req.user!.id,
          type: 'SUCCESS',
          title: 'Bid Accepted',
          message: 'You have accepted a bid for your intent.',
        },
      });

      res.json({ message: 'Bid accepted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/bids/:bidId/reject',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, bidId } = req.params;

      const intent = await prisma.intent.findUnique({ where: { id } });

      if (!intent) {
        throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
      }

      if (intent.requesterId !== req.user!.id) {
        throw createError('Only the requester can reject bids', 403, 'FORBIDDEN');
      }

      await prisma.bid.update({
        where: { id: bidId },
        data: { status: 'REJECTED' },
      });

      res.json({ message: 'Bid rejected' });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/complete',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { result, proof } = req.body;

      const intent = await prisma.intent.findUnique({
        where: { id },
        include: {
          task: true,
        },
      });

      if (!intent) {
        throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
      }

      if (intent.selectedSolverId !== req.user!.id && intent.requesterId !== req.user!.id) {
        throw createError('Not authorized', 403, 'FORBIDDEN');
      }

      if (intent.status !== 'EXECUTING' && intent.status !== 'ASSIGNED') {
        throw createError('Cannot complete intent in current status', 400, 'INVALID_STATUS');
      }

      const [updatedIntent, updatedTask] = await Promise.all([
        prisma.intent.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        }),
        prisma.task.update({
          where: { intentId: id },
          data: {
            status: 'COMPLETED',
            result,
            proof,
            completedAt: new Date(),
          },
        }),
      ]);

      res.json({ intent: updatedIntent, task: updatedTask });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/dispute',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const intent = await prisma.intent.findUnique({
        where: { id },
        include: {
          task: true,
        },
      });

      if (!intent) {
        throw createError('Intent not found', 404, 'INTENT_NOT_FOUND');
      }

      if (intent.requesterId !== req.user!.id && intent.selectedSolverId !== req.user!.id) {
        throw createError('Not authorized to raise dispute', 403, 'FORBIDDEN');
      }

      await prisma.$transaction([
        prisma.intent.update({
          where: { id },
          data: { status: 'DISPUTED' },
        }),
        prisma.task.update({
          where: { intentId: id },
          data: {
            status: 'DISPUTED',
            disputeReason: reason,
          },
        }),
        prisma.dispute.create({
          data: {
            taskId: intent.task!.id,
            raisedBy: req.user!.id,
            reason,
            status: 'OPEN',
          },
        }),
      ]);

      res.json({ message: 'Dispute raised successfully' });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id/bids',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const bids = await prisma.bid.findMany({
        where: { intentId: id },
        include: {
          agent: {
            include: {
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
              reputation: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json(bids);
    } catch (error) {
      next(error);
    }
  }
);

export const intentRouter = router;
