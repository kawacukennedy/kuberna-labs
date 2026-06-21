import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/express.d.js';
import { authenticate } from '../middleware/auth.js';
import { agentOrchestratorService } from '../services/agentOrchestrator.js';
import { aiService } from '../services/ai.js';
import { agentDecisionEngine, marketData } from '../services/agentDecision.js';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const idempotencyStore = new Map<string, { result: unknown; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore) {
    if (entry.expiresAt < now) idempotencyStore.delete(key);
  }
}, 60_000);

const router = Router();

router.post('/:id/run', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { task, idempotencyKey } = req.body;

    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      throw createError('Task description is required', 400, 'VALIDATION_ERROR');
    }

    if (idempotencyKey) {
      const cacheKey = `${req.user!.id}:${id}:${idempotencyKey}`;
      const existing = idempotencyStore.get(cacheKey);
      if (existing && existing.expiresAt > Date.now()) {
        res.status(200).json({
          success: true,
          data: existing.result,
          cached: true,
        });
        return;
      }
    }

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }
    if (agent.ownerId !== req.user!.id) {
      throw createError('Not authorized to run this agent', 403, 'FORBIDDEN');
    }

    const result = await agentOrchestratorService.runTask(id, task.trim());

    if (idempotencyKey) {
      const cacheKey = `${req.user!.id}:${id}:${idempotencyKey}`;
      idempotencyStore.set(cacheKey, {
        result,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      });
    }

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/trace', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const page = req.query.page ? Number(req.query.page) : 1;
    const cursor = req.query.cursor as string | undefined;

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }
    if (agent.ownerId !== req.user!.id && !req.user!.roles.includes('ADMIN')) {
      throw createError('Not authorized', 403, 'FORBIDDEN');
    }

    const result = await agentOrchestratorService.getDecisionTrace(id, { limit, page, cursor });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/preview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { task } = req.body;

    if (!task || typeof task !== 'string') {
      throw createError('Task description is required', 400, 'VALIDATION_ERROR');
    }

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    const parsedIntent = await aiService.parseIntentFromNaturalLanguage(task);
    const blockTimestamp = Math.floor(Date.now() / 1000);
    const state = await marketData.getMarketState(blockTimestamp);
    const strategies = ['arbitrage', 'yield', 'stopLoss'] as const;
    const action = await agentDecisionEngine.evaluate(id, [...strategies], blockTimestamp);

    res.json({
      success: true,
      data: {
        agentId: id,
        agentName: agent.name,
        taskDescription: task,
        aiParsedIntent: {
          sourceChain: parsedIntent.sourceChain,
          sourceToken: parsedIntent.sourceToken,
          sourceAmount: parsedIntent.sourceAmount,
          destChain: parsedIntent.destChain,
          destToken: parsedIntent.destToken,
          minDestAmount: parsedIntent.minDestAmount,
          confidence: parsedIntent.confidence,
        },
        marketState: {
          prices: state.prices,
          bestApy: Object.entries(state.apy)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([p, r]) => ({ protocol: p, apy: r.toFixed(2) + '%' })),
        },
        decision: {
          type: action.type,
          reason: action.reason,
          confidence: action.confidence,
          willCreateIntent: action.type === 'postIntent',
        },
        previewedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export const agentOrchestratorRouter = router;
