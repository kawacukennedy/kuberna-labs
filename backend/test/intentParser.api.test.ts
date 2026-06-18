import request from 'supertest';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { intentParserRouter } from '../src/routes/intentParser.js';

const app = express();
app.use(express.json());
app.use('/api/intents', intentParserRouter);
app.use(errorHandler);

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

describe('POST /api/intents/parse', () => {
  it('should parse a valid intent description', async () => {
    const res = await request(app)
      .post('/api/intents/parse')
      .send({ description: 'swap 1 ETH for USDC on Solana' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.sourceToken).toBe('ETH');
    expect(res.body.data.destToken).toBe('USDC');
    expect(res.body.data.sourceChain).toBe('solana');
    expect(res.body.data.sourceAmount).toBe('1');
    expect(res.body.data.confidence).toBeGreaterThan(0);
    expect(res.body.data.rawDescription).toBe('swap 1 ETH for USDC on Solana');
  });

  it('should return 400 for missing description', async () => {
    const res = await request(app)
      .post('/api/intents/parse')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for empty description', async () => {
    const res = await request(app)
      .post('/api/intents/parse')
      .send({ description: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should handle cross-chain bridge intent', async () => {
    const res = await request(app)
      .post('/api/intents/parse')
      .send({ description: 'bridge 500 USDC from Ethereum to Arbitrum' });

    expect(res.status).toBe(200);
    expect(res.body.data.sourceChain).toBe('ethereum');
    expect(res.body.data.destChain).toBe('arbitrum');
    expect(res.body.data.sourceAmount).toBe('500');
  });
});
