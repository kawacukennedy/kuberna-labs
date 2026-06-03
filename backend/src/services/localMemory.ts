import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { embeddingService } from './embeddingService.js';
import type { StructuredIntent } from './intentParser.js';

interface MemoryEntry {
  description: string;
  intent: StructuredIntent;
  vector: number[];
}

export class LocalMemoryService {
  private entries: MemoryEntry[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await embeddingService.initialize();
    try {
      const memories = await prisma.intentMemory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      for (const mem of memories) {
        const intent = mem.intentData as unknown as StructuredIntent;
        this.entries.push({
          description: mem.description,
          intent,
          vector: [],
        });
      }

      if (this.entries.length > 0) {
        const texts = this.entries.map(e => e.description);
        const vectors = await embeddingService.embedBatch(texts);
        for (let i = 0; i < vectors.length; i++) {
          this.entries[i].vector = vectors[i];
        }
      }

      this.initialized = true;
      logger.info(`LocalMemory initialized with ${this.entries.length} entries`);
    } catch (error) {
      logger.warn('LocalMemory initialization skipped', { error });
      this.initialized = true;
    }
  }

  async store(description: string, intent: StructuredIntent): Promise<void> {
    const vector = await embeddingService.embed(description);
    this.entries.push({ description, intent, vector });

    try {
      await prisma.intentMemory.create({
        data: {
          description,
          intentData: intent as unknown as Record<string, unknown>,
          confidence: intent.confidence,
        },
      });
    } catch (error) {
      logger.warn('Failed to persist memory to database', { error });
    }

    if (this.entries.length > 1000) {
      this.entries = this.entries.slice(-500);
    }
  }

  async query(description: string, threshold = 0.9): Promise<StructuredIntent | null> {
    if (this.entries.length === 0) return null;

    const queryVector = await embeddingService.embed(description);

    let bestScore = 0;
    let bestEntry: MemoryEntry | null = null;

    const queryTerms = new Set(description.toLowerCase().split(/\s+/));

    for (const entry of this.entries) {
      const entryTerms = new Set(entry.description.toLowerCase().split(/\s+/));
      const intersection = new Set([...queryTerms].filter(t => entryTerms.has(t)));
      const union = new Set([...queryTerms, ...entryTerms]);
      const jaccard = union.size === 0 ? 0 : intersection.size / union.size;

      if (jaccard > 0.7) {
        return { ...entry.intent, confidence: jaccard };
      }

      const cosineSim = embeddingService.cosineSimilarity(queryVector, entry.vector);
      if (cosineSim > bestScore) {
        bestScore = cosineSim;
        bestEntry = entry;
      }
    }

    if (bestEntry && bestScore >= threshold) {
      return { ...bestEntry.intent, confidence: bestScore };
    }

    return null;
  }

  async retrieveSimilar(description: string, topK = 5): Promise<Array<{ description: string; intent: StructuredIntent; similarity: number }>> {
    if (this.entries.length === 0) return [];

    const queryVector = await embeddingService.embed(description);
    const scored = this.entries.map(entry => ({
      ...entry,
      similarity: embeddingService.cosineSimilarity(queryVector, entry.vector),
    }));
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK).map(s => ({
      description: s.description,
      intent: s.intent,
      similarity: s.similarity,
    }));
  }

  async storeAgentMemory(
    agentId: string,
    decisionType: string,
    marketData: Record<string, unknown>,
    action: Record<string, unknown>,
    success: boolean,
  ): Promise<void> {
    try {
      await prisma.agentMemory.create({
        data: {
          agentId,
          decisionType,
          marketData: marketData as unknown as Record<string, unknown>,
          action: action as unknown as Record<string, unknown>,
          success,
        },
      });
    } catch (error) {
      logger.warn('Failed to store agent memory', { error });
    }
  }

  async queryAgentMemory(
    agentId: string,
    decisionType: string,
  ): Promise<Array<{ marketData: Record<string, unknown>; action: Record<string, unknown>; success: boolean }>> {
    try {
      const memories = await prisma.agentMemory.findMany({
        where: { agentId, decisionType },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return memories.map((m: { marketData: unknown; action: unknown; success: boolean }) => ({
        marketData: m.marketData as Record<string, unknown>,
        action: m.action as Record<string, unknown>,
        success: m.success,
      }));
    } catch {
      return [];
    }
  }

  async getStats(): Promise<{ totalMemoryEntries: number; totalAgentMemories: number; usingTransformer: boolean }> {
    let totalAgentMemories = 0;
    try {
      totalAgentMemories = await prisma.agentMemory.count();
    } catch { /* empty */ }
    return {
      totalMemoryEntries: this.entries.length,
      totalAgentMemories,
      usingTransformer: embeddingService.isUsingTransformer(),
    };
  }
}

export const localMemory = new LocalMemoryService();
