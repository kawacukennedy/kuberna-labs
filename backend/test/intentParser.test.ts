import { parseIntent } from '../src/services/intentParser.js';

jest.mock('../src/services/localMemory.js', () => ({
  localMemory: {
    query: jest.fn().mockResolvedValue(null),
    store: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/services/ragService.js', () => ({
  ragService: {
    enhanceIntentWithRAG: jest.fn().mockImplementation((_desc, intent) => Promise.resolve(intent)),
  },
}));

jest.mock('../src/services/embeddingService.js', () => ({
  embeddingService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    embed: jest.fn().mockResolvedValue(new Array(64).fill(0)),
    embedBatch: jest.fn().mockResolvedValue([]),
    cosineSimilarity: jest.fn().mockReturnValue(0),
    isReady: jest.fn().mockReturnValue(true),
    isUsingTransformer: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('../src/utils/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), child: jest.fn() },
}));

describe('IntentParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse swap ETH for USDC on Ethereum', async () => {
    const result = await parseIntent('swap 1 ETH for USDC on Solana', false);
    expect(result.sourceChain).toBe('solana');
    expect(result.destChain).toBe('solana');
    expect(result.sourceToken).toBe('ETH');
    expect(result.destToken).toBe('USDC');
    expect(result.sourceAmount).toBe('1');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should parse cross-chain bridge', async () => {
    const result = await parseIntent('bridge 500 USDC from Ethereum to Arbitrum', false);
    expect(result.sourceChain).toBe('ethereum');
    expect(result.destChain).toBe('arbitrum');
    expect(result.sourceToken).toBe('USDC');
    expect(result.sourceAmount).toBe('500');
    expect(result.destToken).toBe('USDC');
  });

  it('should parse simple swap with arrows', async () => {
    const result = await parseIntent('100 USDC -> ETH on Arbitrum', false);
    expect(result.sourceToken).toBe('USDC');
    expect(result.destToken).toBe('ETH');
    expect(result.sourceChain).toBe('arbitrum');
    expect(result.sourceAmount).toBe('100');
  });

  it('should handle empty description', async () => {
    const result = await parseIntent('', false);
    expect(result.confidence).toBe(0);
  });

  it('should handle very short descriptions with fallback', async () => {
    const result = await parseIntent('buy ETH', false);
    expect(result.sourceChain).toBe('ethereum');
    expect(result.sourceToken).toBe('ETH');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should resolve chain synonyms', async () => {
    const result = await parseIntent('swap 10 SOL for USDC on Solana', false);
    expect(result.sourceChain).toBe('solana');
    expect(result.sourceToken).toBe('SOL');
  });

  it('should handle token synonym MATIC -> Polygon', async () => {
    const result = await parseIntent('swap 100 MATIC for USDC', false);
    expect(result.sourceToken).toBe('MATIC');
    expect(result.destToken).toBe('USDC');
  });

  it('should include raw description', async () => {
    const desc = 'swap 1 ETH for USDC on Solana';
    const result = await parseIntent(desc, false);
    expect(result.rawDescription).toBe(desc);
  });

  it('should set default timeout and budget', async () => {
    const result = await parseIntent('swap 1 ETH for USDC', false);
    expect(result.timeoutSeconds).toBe(600);
    expect(result.budget).toBe(10);
    expect(result.currency).toBe('USD');
  });
});
