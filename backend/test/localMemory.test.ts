import { LocalMemoryService } from '../src/services/localMemory.js';

jest.mock('../src/utils/prisma.js', () => ({
  prisma: {
    intentMemory: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
    },
    agentMemory: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

jest.mock('../src/services/embeddingService.js', () => ({
  embeddingService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    embed: jest.fn().mockImplementation(async (text: string) => {
      const words = text.toLowerCase().split(/\s+/);
      const vec = new Array(64).fill(0);
      words.forEach((w, i) => {
        let hash = 0;
        for (let j = 0; j < w.length; j++) {
          hash = ((hash << 5) - hash) + w.charCodeAt(j);
          hash |= 0;
        }
        vec[Math.abs(hash) % 64] += 1;
      });
      const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      return mag > 0 ? vec.map(v => v / mag) : vec;
    }),
    embedBatch: jest.fn().mockResolvedValue([]),
    cosineSimilarity: jest.fn().mockReturnValue(0.5),
    isReady: jest.fn().mockReturnValue(true),
    isUsingTransformer: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('../src/utils/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), child: jest.fn() },
}));

describe('LocalMemoryService', () => {
  let service: LocalMemoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LocalMemoryService();
  });

  it('should initialize successfully', async () => {
    await service.initialize();
    const stats = await service.getStats();
    expect(stats.totalMemoryEntries).toBe(0);
  });

  it('should store and retrieve exact matches', async () => {
    await service.initialize();
    const intent = {
      sourceChain: 'solana',
      sourceToken: 'ETH',
      sourceAmount: '1',
      destChain: 'solana',
      destToken: 'USDC',
      minDestAmount: '0',
      timeoutSeconds: 600,
      budget: 10,
      currency: 'USD',
      confidence: 0.85,
      rawDescription: 'swap 1 ETH for USDC on Solana',
    };

    await service.store('swap 1 ETH for USDC on Solana', intent);
    const result = await service.query('swap 1 ETH for USDC on Solana');
    expect(result).not.toBeNull();
    expect(result!.sourceToken).toBe('ETH');
    expect(result!.destToken).toBe('USDC');
  });

  it('should return null for non-matching queries', async () => {
    await service.initialize();
    const result = await service.query('completely unrelated text about weather');
    expect(result).toBeNull();
  });

  it('should keep track of total entries', async () => {
    await service.initialize();
    await service.store('test one', {
      sourceChain: 'ethereum', sourceToken: 'ETH', sourceAmount: '1',
      destChain: 'ethereum', destToken: 'USDC', minDestAmount: '0',
      timeoutSeconds: 600, budget: 10, currency: 'USD', confidence: 0.5,
      rawDescription: 'test one',
    });
    await service.store('test two', {
      sourceChain: 'solana', sourceToken: 'SOL', sourceAmount: '10',
      destChain: 'solana', destToken: 'USDC', minDestAmount: '0',
      timeoutSeconds: 600, budget: 10, currency: 'USD', confidence: 0.5,
      rawDescription: 'test two',
    });
    const stats = await service.getStats();
    expect(stats.totalMemoryEntries).toBe(2);
  });

  it('should retrieve similar descriptions', async () => {
    await service.initialize();
    await service.store('swap ETH for USDC', {
      sourceChain: 'ethereum', sourceToken: 'ETH', sourceAmount: '1',
      destChain: 'ethereum', destToken: 'USDC', minDestAmount: '0',
      timeoutSeconds: 600, budget: 10, currency: 'USD', confidence: 0.7,
      rawDescription: 'swap ETH for USDC',
    });

    const similar = await service.retrieveSimilar('swap ETH to USDC');
    expect(similar.length).toBeGreaterThan(0);
  });

  it('should store agent memories', async () => {
    await service.storeAgentMemory('agent-1', 'arbitrage', { price: 3000 }, { type: 'postIntent' }, true);
    const memories = await service.queryAgentMemory('agent-1', 'arbitrage');
    expect(memories).toEqual([]); // Mock returns empty
  });

  it('should return stats', async () => {
    const stats = await service.getStats();
    expect(stats).toHaveProperty('totalMemoryEntries');
    expect(stats).toHaveProperty('totalAgentMemories');
    expect(stats).toHaveProperty('usingTransformer');
  });
});
