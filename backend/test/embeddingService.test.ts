import { EmbeddingService } from '../src/services/embeddingService.js';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService();
  });

  describe('hash-based embedding fallback', () => {
    it('should produce consistent embeddings for same text', async () => {
      const text = 'swap 1 ETH for USDC';
      const emb1 = await service.embed(text);
      const emb2 = await service.embed(text);
      expect(emb1).toEqual(emb2);
    });

    it('should produce different embeddings for different texts', async () => {
      const emb1 = await service.embed('swap ETH for USDC');
      const emb2 = await service.embed('monitor SOL price');
      expect(emb1).not.toEqual(emb2);
    });

    it('should produce vectors of correct dimension', async () => {
      const emb = await service.embed('test text');
      expect(emb.length).toBe(64);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];
      expect(service.cosineSimilarity(a, b)).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(service.cosineSimilarity(a, b)).toBeCloseTo(0, 5);
    });

    it('should return values between 0 and 1', () => {
      const a = [0.5, 0.5];
      const b = [0.3, 0.7];
      const sim = service.cosineSimilarity(a, b);
      expect(sim).toBeGreaterThanOrEqual(0);
      expect(sim).toBeLessThanOrEqual(1);
    });
  });

  describe('embedBatch', () => {
    it('should embed multiple texts', async () => {
      const texts = ['hello world', 'swap ETH', 'monitor price'];
      const vectors = await service.embedBatch(texts);
      expect(vectors).toHaveLength(3);
      expect(vectors[0].length).toBe(64);
    });
  });

  describe('state', () => {
    it('should report not ready before initialization', () => {
      expect(service.isReady()).toBe(false);
      expect(service.isUsingTransformer()).toBe(false);
    });
  });
});
