import { Router, Response, NextFunction } from 'express';
import { agentDecisionEngine, type DecisionStrategy } from '../services/agentDecision.js';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../types/express.d.js';

const router = Router();

router.post('/:id/decide', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { strategies } = req.body;

    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    if (agent.ownerId !== req.user!.id) {
      throw createError('Not authorized to control this agent', 403, 'FORBIDDEN');
    }

    const agentStrategies: DecisionStrategy[] = strategies || ['arbitrage', 'yield', 'stopLoss'];

    if (!Array.isArray(agentStrategies) || agentStrategies.length === 0) {
      throw createError('At least one strategy is required', 400, 'VALIDATION_ERROR');
    }

    const validStrategies: DecisionStrategy[] = ['arbitrage', 'yield', 'stopLoss'];
    for (const s of agentStrategies) {
      if (!validStrategies.includes(s)) {
        throw createError(`Invalid strategy: ${s}`, 400, 'VALIDATION_ERROR');
      }
    }

    const blockTimestamp = Math.floor(Date.now() / 1000);

    const action = await agentDecisionEngine.evaluate(id, agentStrategies, blockTimestamp);

    res.json({
      success: true,
      data: {
        agentId: id,
        agentName: agent.name,
        strategies: agentStrategies,
        action,
        evaluatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export const agentDecisionRouter = router;
