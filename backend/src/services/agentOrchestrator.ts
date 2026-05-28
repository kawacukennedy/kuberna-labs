import { aiService, type ParsedIntent } from './ai.js';
import { agentDecisionEngine, marketData, type Action, type DecisionStrategy } from './agentDecision.js';
import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';

export interface OrchestrationStep {
  step: string;
  status: 'running' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface OrchestrationResult {
  success: boolean;
  agentId?: string;
  agentName?: string;
  taskDescription: string;
  steps: OrchestrationStep[];
  action?: Action;
  intent?: Record<string, unknown>;
  verification?: Record<string, unknown>;
  error?: string;
  completedAt: string;
}

export class AgentOrchestratorService {
  async runTask(
    agentId: string,
    taskDescription: string,
  ): Promise<OrchestrationResult> {
    const steps: OrchestrationStep[] = [];
    const completedAt = new Date().toISOString();

    const addStep = (name: string) => {
      const step: OrchestrationStep = {
        step: name,
        status: 'running',
        startedAt: new Date().toISOString(),
      };
      steps.push(step);
      return step;
    };

    const completeStep = (step: OrchestrationStep, output?: Record<string, unknown>) => {
      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      if (output) step.output = output;
    };

    const failStep = (step: OrchestrationStep, error: string) => {
      step.status = 'failed';
      step.completedAt = new Date().toISOString();
      step.error = error;
    };

    try {
      // Step 1: Resolve agent
      const resolveStep = addStep('resolve_agent');
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        failStep(resolveStep, 'Agent not found');
        return { success: false, taskDescription, steps, error: 'Agent not found', completedAt };
      }
      completeStep(resolveStep, { agentId: agent.id, agentName: agent.name, status: agent.status });

      // Step 2: Parse task with AI
      const parseStep = addStep('llm_intent_parsing');
      let parsedIntent: ParsedIntent;
      try {
        parsedIntent = await aiService.parseIntentFromNaturalLanguage(taskDescription);
        completeStep(parseStep, {
          description: taskDescription,
          parsedIntent,
          model: 'gpt-4-turbo-preview',
          confidence: parsedIntent.confidence,
        });
      } catch (err) {
        failStep(parseStep, `AI parsing failed: ${String(err)}`);
        return { success: false, agentId, agentName: agent.name, taskDescription, steps, error: `AI parsing failed: ${String(err)}`, completedAt };
      }

      // Step 3: Evaluate market conditions
      const marketStep = addStep('market_analysis');
      const blockTimestamp = Math.floor(Date.now() / 1000);
      const state = marketData.getMarketState(blockTimestamp);
      completeStep(marketStep, {
        prices: state.prices,
        dexPrices: state.dexPrices,
        apy: state.apy,
        timestamp: state.timestamp,
      });

      // Step 4: Agent decision
      const decisionStep = addStep('agent_decision');
      const strategies: DecisionStrategy[] = ['arbitrage', 'yield', 'stopLoss'];
      const action = await agentDecisionEngine.evaluate(agentId, strategies, blockTimestamp);
      completeStep(decisionStep, {
        strategies,
        action: {
          type: action.type,
          reason: action.reason,
          confidence: action.confidence,
          intentParams: action.intentParams,
        },
      });

      // Step 5: Create intent if action is postIntent
      let intentRecord: Record<string, unknown> | undefined;
      if (action.type === 'postIntent') {
        const intentStep = addStep('intent_creation');
        try {
          const deadline = new Date(Date.now() + ((action.intentParams?.timeoutSeconds as number) || 600) * 1000);
          const intent = await prisma.intent.create({
            data: {
              requesterId: agent.ownerId,
              description: taskDescription,
              sourceChain: (parsedIntent.sourceChain || action.intentParams?.sourceChain || 'ethereum') as string,
              sourceToken: (parsedIntent.sourceToken || action.intentParams?.sourceToken || 'ETH') as string,
              sourceAmount: (parsedIntent.sourceAmount || action.intentParams?.sourceAmount || '0') as string,
              destChain: (parsedIntent.destChain || action.intentParams?.destChain || 'ethereum') as string,
              destToken: (parsedIntent.destToken || action.intentParams?.destToken || 'USDC') as string,
              minDestAmount: (parsedIntent.minDestAmount || action.intentParams?.minDestAmount || '0') as string,
              budget: (action.intentParams?.budget ?? 10) as number,
              currency: (action.intentParams?.currency || parsedIntent.sourceToken || 'USDC') as string,
              deadline,
              expiresAt: deadline,
              status: 'OPEN',
            },
          });
          // Create task linking this intent to the agent
          await prisma.task.create({
            data: {
              intentId: intent.id,
              assignedAgentId: agentId,
              status: 'ASSIGNED',
            },
          });
          intentRecord = {
            id: intent.id,
            description: intent.description,
            sourceChain: intent.sourceChain,
            sourceToken: intent.sourceToken,
            destChain: intent.destChain,
            destToken: intent.destToken,
            budget: intent.budget,
            status: intent.status,
          };
          completeStep(intentStep, intentRecord);
        } catch (err) {
          failStep(intentStep, `Intent creation failed: ${String(err)}`);
        }
      }

      // Step 6: Log the orchestration trace
      const logStep = addStep('decision_trace_logging');
      try {
        await prisma.agentMemory.create({
          data: {
            agentId,
            decisionType: action.type === 'postIntent' ? strategies.join(',') : 'wait',
            marketData: state as unknown as Record<string, unknown> as any,
            action: {
              type: action.type,
              reason: action.reason,
              confidence: action.confidence,
              intentParams: action.intentParams,
            } as unknown as Record<string, unknown> as any,
            success: action.type === 'postIntent',
          },
        });
        completeStep(logStep, { stored: true });
      } catch (err) {
        failStep(logStep, `Trace logging failed: ${String(err)}`);
      }

      return {
        success: action.type === 'postIntent',
        agentId,
        agentName: agent.name,
        taskDescription,
        steps,
        action,
        intent: intentRecord,
        completedAt,
      };
    } catch (error) {
      logger.error('Agent orchestration failed:', error);
      return {
        success: false,
        agentId,
        taskDescription,
        steps,
        error: `Orchestration failed: ${String(error)}`,
        completedAt,
      };
    }
  }

  async getDecisionTrace(agentId: string, limit = 20) {
    return prisma.agentMemory.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const agentOrchestratorService = new AgentOrchestratorService();
