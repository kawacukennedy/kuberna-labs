import logger from '../utils/logger.js';

type PipelineFn = (task: string, model: string) => Promise<(text: string) => Promise<{ data: number[] }>>;
let pipelineInstance: PipelineFn | null = null;

async function getTransformerPipeline() {
  if (pipelineInstance) return pipelineInstance;
  try {
    const mod = await import('@xenova/transformers');
    const pipeline = mod.pipeline as unknown as PipelineFn;
    pipelineInstance = pipeline;
    logger.info('Transformers.js pipeline loaded successfully');
    return pipelineInstance;
  } catch (error) {
    logger.warn('Transformers.js not available, using fallback embedding', { error });
    return null;
  }
}

function simpleHashEmbedding(text: string, dimensions = 64): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(dimensions).fill(0);

  for (let i = 0; i < words.length; i++) {
    let hash = 0;
    for (let j = 0; j < words[i].length; j++) {
      hash = ((hash << 5) - hash) + words[i].charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1.0 / words.length;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

export class EmbeddingService {
  private pipe: ((text: string) => Promise<{ data: number[] }>) | null = null;
  private ready = false;
  private useTransformer = false;

  async initialize(): Promise<void> {
    if (this.ready) return;
    try {
      const pipelineFn = await getTransformerPipeline();
      if (pipelineFn) {
        this.pipe = await pipelineFn('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        this.useTransformer = true;
        logger.info('EmbeddingService: using transformer model');
      }
    } catch (error) {
      logger.warn('EmbeddingService: transformer init failed, using hash fallback', { error });
    }
    this.ready = true;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.ready) await this.initialize();

    if (this.useTransformer && this.pipe) {
      try {
        const result = await this.pipe(text);
        return Array.from(result.data);
      } catch (error) {
        logger.warn('Transformer embedding failed, falling back to hash', { error });
      }
    }

    return simpleHashEmbedding(text, 64);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.embed(t)));
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  isReady(): boolean {
    return this.ready;
  }

  isUsingTransformer(): boolean {
    return this.useTransformer;
  }
}

export const embeddingService = new EmbeddingService();
