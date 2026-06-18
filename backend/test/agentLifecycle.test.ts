import request from 'supertest';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler';
import { correlationId } from '../src/middleware/correlationId';

const modelMethods = ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete', 'count', 'updateMany', 'findFirstOrThrow', 'upsert', 'aggregate'];

const createMockModel = () => {
  const model: Record<string, jest.Mock> = {};
  for (const m of modelMethods) {
    model[m] = jest.fn();
  }
  return model;
};

jest.mock('../src/utils/prisma', () => {
  const explicit: Record<string, unknown> = {
    $transaction: jest.fn((cb: () => unknown) => cb()),
  };
  const modelCache: Record<string, Record<string, jest.Mock>> = {};
  return {
    prisma: new Proxy(explicit, {
      get(target, prop: string) {
        if (prop in target) return target[prop];
        if (!modelCache[prop]) {
          modelCache[prop] = createMockModel();
        }
        return modelCache[prop];
      },
    }),
  };
});

jest.mock('../src/services/ai', () => ({
  aiService: {
    parseIntentFromNaturalLanguage: jest.fn(),
  },
}));

jest.mock('../src/middleware/auth', () => {
  const actual = jest.requireActual('../src/middleware/auth');
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      req.user = { id: 'test-user-id', email: 'test@test.com', roles: ['LEARNER'] };
      next();
    },
    optionalAuth: (req: any, _res: any, next: any) => {
      req.user = { id: 'test-user-id', email: 'test@test.com', roles: ['LEARNER'] };
      next();
    },
    requireRoles: (...roles: string[]) => {
      return (req: any, _res: any, next: any) => {
        if (req.user!.roles.some((r: string) => roles.includes(r))) return next();
        return _res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } });
      };
    },
  };
});

jest.mock('../src/middleware/rateLimiter', () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  intentLimiter: (_req: any, _res: any, next: any) => next(),
  strictLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('viem', () => ({
  verifyMessage: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/index', () => ({
  kitePassportService: {
    registerKiteAgent: jest.fn().mockRejectedValue(new Error('mock')),
    updateAgentKiteInfo: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), child: jest.fn() },
}));

jest.mock('../src/services/priceFeed', () => ({
  PriceFeedService: jest.fn(),
  priceFeed: {
    getPrice: jest.fn(),
    clearCache: jest.fn(),
  },
}));

import { prisma } from '../src/utils/prisma';
import { aiService } from '../src/services/ai';
import { marketData } from '../src/services/agentDecision';

let app: express.Express;

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  app = createApp();
});

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(correlationId);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const { authRouter } = require('../src/routes/auth');
  const { agentRouter } = require('../src/routes/agents');
  const { intentRouter } = require('../src/routes/intents');
  const { agentOrchestratorRouter } = require('../src/routes/agentOrchestrator');

  app.use('/api/auth', authRouter);
  app.use('/api/agents', agentRouter);
  app.use('/api/intents', intentRouter);
  app.use('/api/agents', agentOrchestratorRouter);
  app.use(errorHandler);

  return app;
}

const DEFAULT_MOCK_PRICES: Record<string, number> = {
  ETH: 3200, USDC: 1, USDT: 1, DAI: 1,
  SOL: 140, NEAR: 4.5, MATIC: 0.7,
  BTC: 65000, LINK: 15, UNI: 8,
  AAVE: 120, ARB: 1.2,
};

beforeEach(() => {
  jest.clearAllMocks();

  const { priceFeed: pf } = require('../src/services/priceFeed');
  (pf.getPrice as jest.Mock).mockImplementation(
    async (token: string) => DEFAULT_MOCK_PRICES[token.toUpperCase()] ?? 1,
  );
});

describe('Agent Lifecycle Integration', () => {
  describe('Test 1: Agent Creation → Intent Assignment → Execution → Trace', () => {
    it('should create agent, deploy, start, assign intent, execute, and verify trace', async () => {
      // =========================================
      // Step 1: Create agent
      // =========================================
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.agent.create as jest.Mock).mockResolvedValue({
        id: 'agent-1', name: 'Test Agent', ownerId: 'test-user-id',
        description: 'A test trading agent', framework: 'elizaos', model: 'gpt-4',
        status: 'DRAFT', config: {}, tools: [],
        createdAt: new Date(), updatedAt: new Date(),
      });
      (prisma.reputation.create as jest.Mock).mockResolvedValue({});

      const createRes = await request(app)
        .post('/api/agents')
        .send({ name: 'Test Agent', description: 'A test trading agent', framework: 'elizaos', model: 'gpt-4' });
      expect(createRes.status).toBe(201);
      expect(createRes.body.name).toBe('Test Agent');
      expect(createRes.body.status).toBe('DRAFT');

      // =========================================
      // Step 2: Deploy agent → status DEPLOYED
      // =========================================
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id', name: 'Test Agent', status: 'DRAFT',
      });
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        id: 'agent-1', name: 'Test Agent', status: 'DEPLOYED',
        deploymentUrl: 'https://agents.kuberna.africa/agent-1',
      });

      const deployRes = await request(app).post('/api/agents/agent-1/deploy');
      expect(deployRes.status).toBe(200);
      expect(deployRes.body.status).toBe('DEPLOYED');

      // =========================================
      // Step 3: Start agent → status RUNNING
      // =========================================
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id', name: 'Test Agent', status: 'DEPLOYED',
      });
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        id: 'agent-1', name: 'Test Agent', status: 'RUNNING',
      });

      const startRes = await request(app).post('/api/agents/agent-1/start');
      expect(startRes.status).toBe(200);
      expect(startRes.body.status).toBe('RUNNING');

      // =========================================
      // Step 4: Create an intent
      // =========================================
      (prisma.intent.create as jest.Mock).mockResolvedValue({
        id: 'intent-1', description: 'swap 1 ETH for USDC on Polygon',
        sourceChain: 'ethereum', sourceToken: 'ETH', sourceAmount: '1',
        destChain: 'polygon', destToken: 'USDC',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        budget: 10, status: 'OPEN',
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const intentRes = await request(app)
        .post('/api/intents')
        .send({
          description: 'swap 1 ETH for USDC on Polygon', sourceChain: 'ethereum',
          sourceToken: 'ETH', sourceAmount: '1', destChain: 'polygon',
          destToken: 'USDC', deadline: new Date(Date.now() + 86400000).toISOString(), budget: 10,
        });
      expect(intentRes.status).toBe(201);
      expect(intentRes.body.status).toBe('OPEN');

      // =========================================
      // Step 5: Bid on intent (assign agent)
      // =========================================
      (prisma.intent.findUnique as jest.Mock).mockResolvedValue({
        id: 'intent-1', status: 'OPEN', bids: [],
      });
      (prisma.agent.findFirst as jest.Mock).mockResolvedValue({
        id: 'agent-1', name: 'Test Agent', status: 'RUNNING',
      });
      (prisma.bid.create as jest.Mock).mockResolvedValue({
        id: 'bid-1', status: 'PENDING',
      });
      (prisma.intent.update as jest.Mock).mockResolvedValue({});

      const bidRes = await request(app)
        .post('/api/intents/intent-1/bids')
        .send({ price: 100, estimatedTime: 3600 });
      expect(bidRes.status).toBe(201);
      expect(bidRes.body.status).toBe('PENDING');

      // =========================================
      // Step 6: Execute orchestrator (run task)
      // =========================================
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id', name: 'Test Agent', status: 'RUNNING',
      });

      (aiService.parseIntentFromNaturalLanguage as jest.Mock).mockResolvedValue({
        sourceChain: 'ethereum', sourceToken: 'ETH', sourceAmount: '1',
        destChain: 'polygon', destToken: 'USDC', minDestAmount: '0',
        confidence: 0.85, rawDescription: 'swap 1 ETH for USDC on Polygon',
      });

      (prisma.intent.create as jest.Mock).mockResolvedValue({
        id: 'intent-2', description: 'swap 1 ETH for USDC on Polygon via arb',
        sourceChain: 'ethereum', sourceToken: 'ETH', sourceAmount: '1',
        destChain: 'polygon', destToken: 'USDC', budget: 10, status: 'OPEN',
      });
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task-1', intentId: 'intent-2', assignedAgentId: 'agent-1', status: 'ASSIGNED',
      });
      (prisma.agentMemory.create as jest.Mock).mockResolvedValue({
        id: 'memory-1', agentId: 'agent-1',
        decisionType: 'arbitrage,yield,stopLoss',
        action: { type: 'postIntent', reason: 'test arb opportunity', confidence: 0.5 },
        success: true, createdAt: new Date(),
      });

      const runRes = await request(app)
        .post('/api/agents/agent-1/run')
        .send({ task: 'swap 1 ETH for USDC on Polygon' });
      expect(runRes.status).toBe(200);
      expect(runRes.body.success).toBe(true);
      expect(runRes.body.data).toHaveProperty('steps');
      expect(runRes.body.data.steps.length).toBeGreaterThan(0);
      expect(runRes.body.data.steps[0].step).toBe('resolve_agent');
      expect(runRes.body.data.steps[0].status).toBe('completed');

      // =========================================
      // Step 7: Verify trace with pagination
      // =========================================
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id', name: 'Test Agent',
      });
      (prisma.agentMemory.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'memory-1', agentId: 'agent-1',
          decisionType: 'arbitrage,yield,stopLoss',
          marketData: {},
          action: { type: 'postIntent', reason: 'test arb opportunity', confidence: 0.5 },
          success: true, createdAt: new Date().toISOString(),
        },
      ]);

      const traceRes = await request(app).get('/api/agents/agent-1/trace?limit=5');
      expect(traceRes.status).toBe(200);
      expect(traceRes.body.traces).toBeInstanceOf(Array);
      expect(traceRes.body.traces.length).toBe(1);
      expect(traceRes.body.traces[0]).toHaveProperty('action');
      expect(traceRes.body.traces[0].action.type).toBe('postIntent');
    });
  });

  describe('Test 2: Price Feed Integration', () => {
    it('should return valid deterministic price data', async () => {
      const blockTimestamp = Math.floor(Date.now() / 1000);

      const price = await marketData.getPrice('ETH', blockTimestamp);
      expect(price).toBeGreaterThan(0);
      expect(price).toBeGreaterThan(2000);
      expect(price).toBeLessThan(5000);

      const price1 = await marketData.getPrice('ETH', blockTimestamp);
      const price2 = await marketData.getPrice('ETH', blockTimestamp);
      expect(price1).toBe(price2);
    });

    it('should return complete market state with all required fields', async () => {
      const blockTimestamp = Math.floor(Date.now() / 1000);
      const state = await marketData.getMarketState(blockTimestamp);

      expect(state).toHaveProperty('prices');
      expect(state).toHaveProperty('dexPrices');
      expect(state).toHaveProperty('apy');
      expect(state).toHaveProperty('timestamp');
      expect(state).toHaveProperty('blockTimestamp');
      expect(state.blockTimestamp).toBe(blockTimestamp);
    });

    it('should provide price data usable for agent decisions', async () => {
      const blockTimestamp = Math.floor(Date.now() / 1000);
      const state = await marketData.getMarketState(blockTimestamp);

      expect(state.prices.ETH).toBeGreaterThan(2000);
      expect(state.prices.USDC).toBeCloseTo(1, 0);
      expect(state.prices.BTC).toBeGreaterThan(50000);

      expect(state.dexPrices.ETH.Uniswap).toBeGreaterThan(0);
      expect(state.dexPrices.ETH.SushiSwap).toBeGreaterThan(0);
      expect(state.dexPrices.ETH.Uniswap).not.toBe(state.dexPrices.ETH.SushiSwap);

      expect(state.apy.Aave).toBeGreaterThan(0);
      expect(state.apy.Marinade).toBeGreaterThan(0);
      expect(typeof state.apy.Aave).toBe('number');
    });

    it('should return DEX-specific prices that differ from each other', async () => {
      const ts = Math.floor(Date.now() / 1000);
      const uniPrice = await marketData.getDexPrice('ETH', 'Uniswap', ts);
      const sushiPrice = await marketData.getDexPrice('ETH', 'SushiSwap', ts);
      const raydiumPrice = await marketData.getDexPrice('ETH', 'Raydium', ts);

      expect(uniPrice).not.toBe(sushiPrice);
      expect(sushiPrice).not.toBe(raydiumPrice);
      expect(uniPrice).not.toBe(raydiumPrice);
    });

    it('should return price history as array of correct length', async () => {
      const ts = Math.floor(Date.now() / 1000);
      const history = await marketData.getPriceHistory('ETH', ts, 1);
      expect(history.length).toBe(61);
      expect(history[0]).toBeGreaterThan(0);
      expect(history[history.length - 1]).toBeGreaterThan(0);
    });
  });

  describe('Test 3: Error Handling', () => {
    it('should return VALIDATION_ERROR for missing task description', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id', name: 'Test Agent',
      });

      const res = await request(app)
        .post('/api/agents/agent-1/run')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error).toHaveProperty('message');
    });

    it('should return VALIDATION_ERROR for empty task string', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id', name: 'Test Agent',
      });

      const res = await request(app)
        .post('/api/agents/agent-1/run')
        .send({ task: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return AGENT_NOT_FOUND for missing agent', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/agents/non-existent/run')
        .send({ task: 'do something' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AGENT_NOT_FOUND');
    });

    it('should return unified error response shape', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/agents/non-existent/run')
        .send({ task: 'test' });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found' },
      });
    });

    it('should return FORBIDDEN for non-owner agent access', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-other', ownerId: 'other-user-id', name: 'Other Agent',
      });

      const res = await request(app)
        .post('/api/agents/agent-other/run')
        .send({ task: 'do something' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
