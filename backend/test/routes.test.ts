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
        if (req.user!.roles.some((r: string) => roles.includes(r))) {
          return next();
        }
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

jest.mock('bcryptjs', () => {
  const bcrypt = jest.requireActual('bcryptjs');
  return {
    hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
    compare: jest.fn().mockImplementation((password: string, _hash: string) => {
      return Promise.resolve(password === 'password123');
    }),
    hashSync: jest.fn().mockReturnValue('$2a$12$hashedpassword'),
  };
});

jest.mock('viem', () => ({
  verifyMessage: jest.fn().mockResolvedValue(true),
}));

// We read the prisma mock after jest.mock hoisting
import { prisma } from '../src/utils/prisma';

let app: express.Express;
let bcryptHash: string;

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

  const bcrypt = require('bcryptjs');
  bcryptHash = bcrypt.hashSync('password123', 12);

  app = createApp();
});

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(correlationId);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Lazy-import routers to avoid hoisting issues
  const { authRouter } = require('../src/routes/auth');
  const { agentRouter } = require('../src/routes/agents');
  const { intentRouter } = require('../src/routes/intents');
  const { disputeRouter } = require('../src/routes/disputes');

  app.use('/api/auth', authRouter);
  app.use('/api/agents', agentRouter);
  app.use('/api/intents', intentRouter);
  app.use('/api/disputes', disputeRouter);
  app.use(errorHandler);

  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth routes', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'new@test.com',
        fullName: 'New User',
        roles: ['LEARNER'],
        avatarUrl: null,
      });

      
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'password123', fullName: 'New User' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('new@test.com');
      expect(res.body.token).toBeDefined();
    });

    it('rejects duplicate email', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

      
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@test.com', password: 'password123', fullName: 'Dup' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        fullName: 'Test User',
        passwordHash: bcryptHash,
        roles: ['LEARNER'],
        avatarUrl: null,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@test.com');
    }, 15000);

    it('rejects invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'wronghash',
      });

      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns authenticated user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@test.com',
        fullName: 'Test User',
        roles: ['LEARNER'],
        avatarUrl: null,
        web3Address: null,
        mfaEnabled: false,
        createdAt: new Date(),
        profile: { bio: 'test bio' },
        _count: { agents: 2, enrollments: 3, intents: 1 },
      });

      
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@test.com');
      expect(res.body.stats.agentsCount).toBe(2);
    });
  });

  describe('POST /api/auth/web3-nonce', () => {
    it('returns nonce and message', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        web3Address: '0x123',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      
      const res = await request(app)
        .post('/api/auth/web3-nonce')
        .send({ web3Address: '0x1234567890123456789012345678901234567890' });

      expect(res.status).toBe(200);
      expect(res.body.nonce).toBeDefined();
      expect(res.body.message).toContain('Sign this message');
    });
  });

  describe('POST /api/auth/web3-login', () => {
    it('authenticates with valid Web3 signature', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'wallet@test.com',
        fullName: 'Wallet User',
        roles: ['LEARNER'],
        avatarUrl: null,
        web3Address: '0x123',
        web3Nonce: 'test-nonce',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      
      const res = await request(app)
        .post('/api/auth/web3-login')
        .send({
          web3Address: '0x1234567890123456789012345678901234567890',
          signature: '0xsig',
          message: 'Sign this message.\n\nNonce: test-nonce',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns success message regardless of user existence', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If account exists');
    });
  });
});

describe('Agent routes', () => {
  describe('GET /api/agents', () => {
    it('lists agents with pagination', async () => {
      (prisma.agent.findMany as jest.Mock).mockResolvedValue([
        { id: 'agent-1', name: 'Agent 1', owner: { id: 'owner-1', fullName: 'Owner', avatarUrl: null }, reputation: null },
      ]);
      (prisma.agent.count as jest.Mock).mockResolvedValue(1);

      
      const res = await request(app).get('/api/agents');

      expect(res.status).toBe(200);
      expect(res.body.agents).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/agents/templates', () => {
    it('returns agent templates', async () => {
      
      const res = await request(app).get('/api/agents/templates');

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('framework');
    });
  });

  describe('GET /api/agents/:id', () => {
    it('returns agent by id', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', name: 'My Agent', owner: { id: 'owner-1', fullName: 'Owner', avatarUrl: null, profile: null }, reputation: null,
      });

      
      const res = await request(app).get('/api/agents/agent-1');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('My Agent');
    });

    it('returns 404 for non-existent agent', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      
      const res = await request(app).get('/api/agents/non-existent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/agents', () => {
    it('creates a new agent', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.agent.create as jest.Mock).mockResolvedValue({
        id: 'agent-new', name: 'New Agent', status: 'DRAFT',
      });
      (prisma.reputation.create as jest.Mock).mockResolvedValue({});

      
      const res = await request(app)
        .post('/api/agents')
        .send({ name: 'New Agent', description: 'An agent', framework: 'elizaos', model: 'gpt-4' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Agent');
    });

    it('rejects duplicate agent name', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({ id: 'existing', name: 'Dup Agent', ownerId: 'test-user-id' });

      
      const res = await request(app)
        .post('/api/agents')
        .send({ name: 'Dup Agent', description: 'Dup', framework: 'elizaos', model: 'gpt-4' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/agents/:id', () => {
    it('updates an agent', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id',
      });
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        id: 'agent-1', name: 'Updated Agent',
      });

      
      const res = await request(app)
        .patch('/api/agents/agent-1')
        .send({ name: 'Updated Agent' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Agent');
    });

    it('rejects update by non-owner', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'other-user',
      });

      
      const res = await request(app)
        .patch('/api/agents/agent-1')
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent agent', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      
      const res = await request(app).patch('/api/agents/non-existent').send({ name: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('deletes an agent', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue({
        id: 'agent-1', ownerId: 'test-user-id',
      });
      (prisma.agent.delete as jest.Mock).mockResolvedValue({});

      
      const res = await request(app).delete('/api/agents/agent-1');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/agents/:id/reputation', () => {
    it('returns agent reputation', async () => {
      (prisma.reputation.findUnique as jest.Mock).mockResolvedValue({
        agentId: 'agent-1', score: 85, totalTasks: 10,
      });

      
      const res = await request(app).get('/api/agents/agent-1/reputation');

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(85);
    });

    it('returns 404 if reputation not found', async () => {
      (prisma.reputation.findUnique as jest.Mock).mockResolvedValue(null);

      
      const res = await request(app).get('/api/agents/agent-1/reputation');

      expect(res.status).toBe(404);
    });
  });
});

describe('Intent routes', () => {
  describe('GET /api/intents', () => {
    it('lists intents with pagination', async () => {
      (prisma.intent.findMany as jest.Mock).mockResolvedValue([
        { id: 'intent-1', description: 'Test intent', requester: { id: 'u1', fullName: 'User', avatarUrl: null }, _count: { bids: 0 } },
      ]);
      (prisma.intent.count as jest.Mock).mockResolvedValue(1);

      
      const res = await request(app).get('/api/intents');

      expect(res.status).toBe(200);
      expect(res.body.intents).toHaveLength(1);
    });
  });

  describe('POST /api/intents', () => {
    it('creates a new intent', async () => {
      (prisma.intent.create as jest.Mock).mockResolvedValue({
        id: 'intent-new', description: 'My intent', status: 'OPEN',
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      
      const res = await request(app)
        .post('/api/intents')
        .send({
          description: 'My intent',
          sourceChain: 'ethereum',
          sourceToken: 'USDC',
          sourceAmount: '100',
          destChain: 'polygon',
          destToken: 'USDC',
          deadline: new Date(Date.now() + 86400000).toISOString(),
          budget: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('OPEN');
    });
  });

  describe('POST /api/intents/:id/bids', () => {
    it('submits a bid on an intent', async () => {
      (prisma.intent.findUnique as jest.Mock).mockResolvedValue({
        id: 'intent-1', status: 'OPEN', bids: [],
      });
      (prisma.agent.findFirst as jest.Mock).mockResolvedValue({
        id: 'agent-1', status: 'DEPLOYED',
      });
      (prisma.bid.create as jest.Mock).mockResolvedValue({
        id: 'bid-1', status: 'PENDING',
      });
      (prisma.intent.update as jest.Mock).mockResolvedValue({});

      
      const res = await request(app)
        .post('/api/intents/intent-1/bids')
        .send({ price: 100, estimatedTime: 3600 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDING');
    });

    it('rejects bid if intent not open', async () => {
      (prisma.intent.findUnique as jest.Mock).mockResolvedValue({
        id: 'intent-1', status: 'COMPLETED', bids: [],
      });

      
      const res = await request(app)
        .post('/api/intents/intent-1/bids')
        .send({ price: 100, estimatedTime: 3600 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/intents/:id', () => {
    it('returns intent details', async () => {
      (prisma.intent.findUnique as jest.Mock).mockResolvedValue({
        id: 'intent-1', description: 'Test', requester: { id: 'u1', fullName: 'User', avatarUrl: null, profile: null },
        bids: [], task: null,
      });

      
      const res = await request(app).get('/api/intents/intent-1');

      expect(res.status).toBe(200);
    });
  });
});

describe('Dispute routes', () => {
  describe('GET /api/disputes', () => {
    it('rejects non-admin users', async () => {
      
      const res = await request(app).get('/api/disputes');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/disputes/:id', () => {
    it('returns a dispute', async () => {
      (prisma.dispute.findUnique as jest.Mock).mockResolvedValue({
        id: 'dispute-1',
        status: 'OPEN',
        task: {
          id: 'task-1',
          assignedAgentId: 'other-user',
          intent: { id: 'intent-1', description: 'Test', requesterId: 'test-user-id', budget: 100 },
          executor: { id: 'other-user', fullName: 'Executor', email: 'exec@test.com' },
        },
      });

      
      const res = await request(app).get('/api/disputes/dispute-1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OPEN');
    });

    it('returns 404 for non-existent dispute', async () => {
      (prisma.dispute.findUnique as jest.Mock).mockResolvedValue(null);

      
      const res = await request(app).get('/api/disputes/non-existent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/disputes/:id/evidence', () => {
    it('submits evidence', async () => {
      (prisma.dispute.findUnique as jest.Mock).mockResolvedValue({
        id: 'dispute-1', status: 'OPEN',
        task: { intent: { requesterId: 'test-user-id' }, assignedAgentId: 'other-user' },
      });
      (prisma.dispute.update as jest.Mock).mockResolvedValue({ id: 'dispute-1' });

      
      const res = await request(app)
        .post('/api/disputes/dispute-1/evidence')
        .send({ evidence: 'Here is proof' });

      expect(res.status).toBe(200);
    });

    it('rejects evidence if not party to dispute', async () => {
      (prisma.dispute.findUnique as jest.Mock).mockResolvedValue({
        id: 'dispute-1', status: 'OPEN',
        task: { intent: { requesterId: 'other-user' }, assignedAgentId: 'other-user' },
      });

      
      const res = await request(app)
        .post('/api/disputes/dispute-1/evidence')
        .send({ evidence: 'Proof' });

      expect(res.status).toBe(403);
    });
  });
});
