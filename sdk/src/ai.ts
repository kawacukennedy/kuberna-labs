import { KubernaSDK } from './index.js';

export interface ParseIntentResult {
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destChain: string;
  destToken: string;
  minDestAmount: string;
  timeoutSeconds: number;
  budget: number;
  currency: string;
  confidence: number;
  rawDescription: string;
}

export interface AgentDecision {
  action: string;
  reason: string;
  confidence: number;
  parameters: Record<string, unknown>;
  timestamp: string;
}

export interface AnalyzeParams {
  text: string;
  context?: Record<string, unknown>;
}

export interface AnalysisResult {
  intent: string;
  entities: Record<string, unknown>;
  sentiment: string;
  confidence: number;
}

export class AiManager {
  constructor(private sdk: KubernaSDK) {}

  async parseIntent(description: string): Promise<ParseIntentResult> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/intents/parse',
      data: { description },
    });
    return response.data as ParseIntentResult;
  }

  async getDecision(agentId: string, context?: Record<string, unknown>): Promise<AgentDecision> {
    const response = await this.sdk.request({
      method: 'POST',
      path: `/agents/${agentId}/decide`,
      data: { context } as Record<string, unknown>,
    });
    return response.data as AgentDecision;
  }

  async analyze(params: AnalyzeParams): Promise<AnalysisResult> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/ai/analyze',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as AnalysisResult;
  }
}
