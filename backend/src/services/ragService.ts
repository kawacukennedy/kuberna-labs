import { localMemory } from './localMemory.js';
import { embeddingService } from './embeddingService.js';
import logger from '../utils/logger.js';
import type { StructuredIntent } from './intentParser.js';

export interface RAGContext {
  similarIntents: Array<{
    description: string;
    intent: StructuredIntent;
    similarity: number;
  }>;
  agentHistory: Array<{
    marketData: Record<string, unknown>;
    action: Record<string, unknown>;
    success: boolean;
  }>;
  summary: string;
}

export class RAGService {
  async getContext(
    query: string,
    agentId?: string,
    topK = 5,
  ): Promise<RAGContext> {
    const similarIntents = await localMemory.retrieveSimilar(query, topK);

    let agentHistory: Array<{ marketData: Record<string, unknown>; action: Record<string, unknown>; success: boolean }> = [];
    if (agentId) {
      const arbitrageHistory = await localMemory.queryAgentMemory(agentId, 'arbitrage');
      const yieldHistory = await localMemory.queryAgentMemory(agentId, 'yield');
      const stopLossHistory = await localMemory.queryAgentMemory(agentId, 'stopLoss');
      agentHistory = [...arbitrageHistory, ...yieldHistory, ...stopLossHistory]
        .sort(() => 0.5 - Math.random())
        .slice(0, topK);
    }

    const summary = this.generateSummary(query, similarIntents, agentHistory);

    return { similarIntents, agentHistory, summary };
  }

  private generateSummary(
    query: string,
    similarIntents: Array<{ description: string; intent: StructuredIntent; similarity: number }>,
    agentHistory: Array<{ marketData: Record<string, unknown>; action: Record<string, unknown>; success: boolean }>,
  ): string {
    const parts: string[] = [];

    if (similarIntents.length > 0) {
      const topMatch = similarIntents[0];
      parts.push(`Found ${similarIntents.length} similar past intents. Best match: "${topMatch.description}" (${(topMatch.similarity * 100).toFixed(0)}% similar)`);

      const highConfidence = similarIntents.filter(s => s.similarity > 0.8);
      if (highConfidence.length > 0) {
        parts.push(`There are ${highConfidence.length} high-confidence matches in memory.`);
      }
    }

    if (agentHistory.length > 0) {
      const successful = agentHistory.filter(h => h.success).length;
      const failed = agentHistory.filter(h => !h.success).length;
      parts.push(`Agent has ${agentHistory.length} past decisions: ${successful} successful, ${failed} failed.`);
    }

    if (parts.length === 0) {
      return 'No relevant context found in memory.';
    }

    return parts.join(' ');
  }

  async enhanceIntentWithRAG(description: string, baseIntent: StructuredIntent): Promise<StructuredIntent> {
    const context = await this.getContext(description, undefined, 3);

    if (context.similarIntents.length > 0) {
      const bestMatch = context.similarIntents[0];
      if (bestMatch.similarity > 0.75) {
        logger.info('RAG enhanced intent using similar past intent', {
          similarity: bestMatch.similarity,
          matchedDescription: bestMatch.description,
        });
        return {
          ...bestMatch.intent,
          confidence: Math.max(baseIntent.confidence, bestMatch.similarity),
          rawDescription: description,
        };
      }
    }

    return baseIntent;
  }
}

export const ragService = new RAGService();
