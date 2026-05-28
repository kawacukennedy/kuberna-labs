import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/express.d.js';
import { authenticate } from '../middleware/auth.js';
import { agentOrchestratorService } from '../services/agentOrchestrator.js';
import { aiService } from '../services/ai.js';
import { agentDecisionEngine, marketData } from '../services/agentDecision.js';

const router = Router();

router.post('/:id/run', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { task } = req.body;

    if (!task || typeof task !== 'string' || task.trim().length === 0) {
      throw createError('Task description is required', 400, 'VALIDATION_ERROR');
    }

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }
    if (agent.ownerId !== req.user!.id) {
      throw createError('Not authorized to run this agent', 403, 'FORBIDDEN');
    }

    const result = await agentOrchestratorService.runTask(id, task.trim());

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

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }
    if (agent.ownerId !== req.user!.id && !req.user!.roles.includes('ADMIN')) {
      throw createError('Not authorized', 403, 'FORBIDDEN');
    }

    const trace = await agentOrchestratorService.getDecisionTrace(id, limit);

    res.json({ trace });
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
    const state = marketData.getMarketState(blockTimestamp);
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
