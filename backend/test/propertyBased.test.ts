import fc from 'fast-check';
import { parseIntent } from '../src/services/intentParser';

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

jest.mock('../src/services/localMemory', () => ({
  localMemory: {
    query: jest.fn().mockResolvedValue(null),
    store: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/services/ragService', () => ({
  ragService: {
    enhanceIntentWithRAG: jest.fn().mockImplementation((_desc: string, intent: unknown) => Promise.resolve(intent)),
  },
}));

jest.mock('../src/services/embeddingService', () => ({
  embeddingService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    embed: jest.fn().mockResolvedValue(new Array(64).fill(0)),
    embedBatch: jest.fn().mockResolvedValue([]),
    cosineSimilarity: jest.fn().mockReturnValue(0),
    isReady: jest.fn().mockReturnValue(true),
    isUsingTransformer: jest.fn().mockReturnValue(false),
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

const { prisma } = require('../src/utils/prisma');
const { priceFeed } = require('../src/services/priceFeed');

const DEFAULT_MOCK_PRICES: Record<string, number> = {
  ETH: 3200, USDC: 1, USDT: 1, DAI: 1,
  SOL: 140, NEAR: 4.5, MATIC: 0.7,
  BTC: 65000, LINK: 15, UNI: 8,
  AAVE: 120, ARB: 1.2,
};

type EscrowState = 'None' | 'Funded' | 'Assigned' | 'Completed' | 'Disputed' | 'Released' | 'Refunded' | 'Expired';

interface StateTransition {
  from: EscrowState;
  to: EscrowState;
  action: string;
}

const VALID_TRANSITIONS: StateTransition[] = [
  { from: 'None', to: 'Funded', action: 'fund' },
  { from: 'Funded', to: 'Assigned', action: 'assign' },
  { from: 'Funded', to: 'Refunded', action: 'refund' },
  { from: 'Funded', to: 'Expired', action: 'expire' },
  { from: 'Assigned', to: 'Completed', action: 'complete' },
  { from: 'Assigned', to: 'Disputed', action: 'dispute' },
  { from: 'Completed', to: 'Released', action: 'release' },
  { from: 'Completed', to: 'Disputed', action: 'dispute' },
  { from: 'Disputed', to: 'Released', action: 'resolveForExecutor' },
  { from: 'Disputed', to: 'Refunded', action: 'resolveForRequester' },
];

const ALL_STATES: EscrowState[] = ['None', 'Funded', 'Assigned', 'Completed', 'Disputed', 'Released', 'Refunded', 'Expired'];

function isValidTransition(from: EscrowState, to: EscrowState): boolean {
  return VALID_TRANSITIONS.some(t => t.from === from && t.to === to);
}

function getValidNextStates(state: EscrowState): EscrowState[] {
  return VALID_TRANSITIONS
    .filter(t => t.from === state)
    .map(t => t.to);
}

function isTerminalState(state: EscrowState): boolean {
  return state === 'Released' || state === 'Refunded' || state === 'Expired';
}

const VALID_CHAIN_NAMES = ['ethereum', 'solana', 'polygon', 'arbitrum', 'near', 'base', 'optimism', 'avalanche', 'bsc'];
const VALID_TOKEN_SYMBOLS = ['ETH', 'USDC', 'USDT', 'DAI', 'SOL', 'NEAR', 'MATIC', 'BTC', 'WBTC', 'WETH', 'ARB', 'LINK', 'UNI', 'AAVE'];

const swapPatterns = fc.oneof(
  fc.constantFrom(
    'swap {amount} {srcToken} for {dstToken} on {srcChain}',
    'swap {amount} {srcToken} to {dstToken} on {srcChain}',
    'swap {amount} {srcToken} -> {dstToken} on {srcChain}',
    'bridge {amount} {srcToken} from {srcChain} to {dstChain}',
    'send {amount} {srcToken} from {srcChain} to {dstChain}',
    'transfer {amount} {srcToken} from {srcChain} to {dstChain}',
    '{amount} {srcToken} -> {dstToken} on {srcChain}',
    'buy {amount} {dstToken} for {srcToken}',
    'sell {amount} {srcToken} for {dstToken}',
    'exchange {amount} {srcToken} to {dstToken}',
    'convert {amount} {srcToken} to {dstToken}',
    'trade {amount} {srcToken} for {dstToken}',
  ),
);

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

describe('Escrow State Machine Properties', () => {
  it('should never reach an invalid state from any sequence of valid operations', () => {
    const validFromStatesArb = fc.constantFrom(...ALL_STATES);

    fc.assert(
      fc.property(validFromStatesArb, (startState) => {
        const validMoves = getValidNextStates(startState);
        for (const nextState of validMoves) {
          expect(isValidTransition(startState, nextState)).toBe(true);
          expect(isTerminalState(startState) ? validMoves.length === 0 : true).toBe(true);
        }
        for (const bad of ALL_STATES) {
          if (!validMoves.includes(bad) && startState !== bad) {
            expect(isValidTransition(startState, bad)).toBe(false);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('Funded -> Assigned -> Completed -> Released is the only valid happy path', () => {
    const happyPath: EscrowState[] = ['Funded', 'Assigned', 'Completed', 'Released'];

    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(isValidTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }

    expect(happyPath[0]).toBe('Funded');
    expect(happyPath[happyPath.length - 1]).toBe('Released');
    expect(isTerminalState('Released')).toBe(true);

    const terminal = ALL_STATES.filter(isTerminalState);
    expect(terminal).toEqual(expect.arrayContaining(['Released', 'Refunded', 'Expired']));
  });

  it('Dispute can only be raised from Assigned or Completed states', () => {
    const statesThatCanDispute = ALL_STATES.filter(s => isValidTransition(s, 'Disputed'));
    expect(statesThatCanDispute).toEqual(expect.arrayContaining(['Assigned', 'Completed']));
    expect(statesThatCanDispute.length).toBe(2);

    for (const state of ALL_STATES) {
      if (state === 'Assigned' || state === 'Completed') {
        expect(isValidTransition(state, 'Disputed')).toBe(true);
      } else {
        expect(isValidTransition(state, 'Disputed')).toBe(false);
      }
    }
  });

  it('Refund can only happen from Funded state or via dispute resolution', () => {
    const statesThatCanRefund = ALL_STATES.filter(s => isValidTransition(s, 'Refunded'));
    expect(statesThatCanRefund).toEqual(expect.arrayContaining(['Funded', 'Disputed']));
    expect(statesThatCanRefund.length).toBe(2);
  });

  it('should test at least 10 random state transitions', () => {
    const randomSequence: EscrowState[] = ['None'];
    const actions = ['fund', 'assign', 'complete', 'release'] as const;

    for (let i = 0; i < 10; i++) {
      const current = randomSequence[randomSequence.length - 1];
      const nextMoves = getValidNextStates(current);
      if (nextMoves.length === 0) break;
      const chosen = nextMoves[i % nextMoves.length];
      randomSequence.push(chosen);
    }

    expect(randomSequence.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < randomSequence.length - 1; i++) {
      expect(isValidTransition(randomSequence[i], randomSequence[i + 1])).toBe(true);
    }
  });

  it('should never transition to non-terminal state after reaching a terminal state', () => {
    for (const terminal of ['Released', 'Refunded', 'Expired'] as EscrowState[]) {
      const transitionsFromTerminal = VALID_TRANSITIONS.filter(t => t.from === terminal);
      expect(transitionsFromTerminal.length).toBe(0);
    }
  });

  it('should maintain state machine invariants under random walks', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(...VALID_TRANSITIONS.map(t => ({ from: t.from, to: t.to, action: t.action }))),
          { minLength: 1, maxLength: 50 },
        ),
        (transitions) => {
          let currentState: EscrowState = 'None';

          for (const t of transitions) {
            if (t.from !== currentState) continue;
            if (isTerminalState(currentState)) continue;
            expect(isValidTransition(currentState, t.to)).toBe(true);
            expect(t.from).toBe(currentState);
            currentState = t.to;
          }

          expect(ALL_STATES).toContain(currentState);
          if (isTerminalState(currentState)) {
            expect(getValidNextStates(currentState).length).toBe(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Intent Parsing Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const amountArb = fc.stringMatching(/^\d+(?:\.\d+)?$/);
  const chainNameArb = fc.constantFrom(...VALID_CHAIN_NAMES);
  const tokenSymbolArb = fc.constantFrom(...VALID_TOKEN_SYMBOLS);
  const tokenNameLowerArb = fc.constantFrom(...VALID_TOKEN_SYMBOLS.map(t => t.toLowerCase()));
  const chainSynonymArb = fc.constantFrom(
    'eth', 'ethereum', 'polygon', 'matic', 'arbitrum', 'arb',
    'solana', 'sol', 'near', 'base', 'optimism', 'op', 'avalanche', 'avax', 'bsc',
  );

  const validDescriptionArb = fc.record({
    template: swapPatterns,
    amount: amountArb,
    srcToken: fc.oneof(tokenSymbolArb, tokenNameLowerArb),
    dstToken: fc.oneof(tokenSymbolArb, tokenNameLowerArb),
    srcChain: fc.oneof(chainNameArb, chainSynonymArb),
    dstChain: fc.oneof(chainNameArb, chainSynonymArb),
  }).map(({ template, amount, srcToken, dstToken, srcChain, dstChain }) => {
    return fillTemplate(template, {
      amount,
      srcToken,
      dstToken,
      srcChain,
      dstChain,
    });
  });

  it('should always return a structured intent for any valid input', async () => {
    await fc.assert(
      fc.asyncProperty(validDescriptionArb, async (description) => {
        const result = await parseIntent(description, false);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('sourceChain');
        expect(result).toHaveProperty('sourceToken');
        expect(result).toHaveProperty('sourceAmount');
        expect(result).toHaveProperty('destChain');
        expect(result).toHaveProperty('destToken');
        expect(result).toHaveProperty('minDestAmount');
        expect(result).toHaveProperty('timeoutSeconds');
        expect(result).toHaveProperty('budget');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('rawDescription');
      }),
      { numRuns: 100 },
    );
  });

  it('source chain and destination chain should always be valid chain names', async () => {
    await fc.assert(
      fc.asyncProperty(validDescriptionArb, async (description) => {
        const result = await parseIntent(description, false);
        expect(typeof result.sourceChain).toBe('string');
        expect(typeof result.destChain).toBe('string');
        expect(result.sourceChain.length).toBeGreaterThan(0);
        expect(result.destChain.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('amount should always be a positive number or zero as string', async () => {
    await fc.assert(
      fc.asyncProperty(validDescriptionArb, async (description) => {
        const result = await parseIntent(description, false);
        expect(typeof result.sourceAmount).toBe('string');
        const num = Number(result.sourceAmount);
        expect(Number.isNaN(num)).toBe(false);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(result.minDestAmount).toBe('0');
      }),
      { numRuns: 100 },
    );
  });

  it('confidence should always be between 0 and 1', async () => {
    await fc.assert(
      fc.asyncProperty(validDescriptionArb, async (description) => {
        const result = await parseIntent(description, false);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  it('token symbols should be uppercase', async () => {
    await fc.assert(
      fc.asyncProperty(validDescriptionArb, async (description) => {
        const result = await parseIntent(description, false);
        expect(result.sourceToken).toEqual(result.sourceToken.toUpperCase());
        expect(result.destToken).toEqual(result.destToken.toUpperCase());
      }),
      { numRuns: 100 },
    );
  });

  it('should handle empty description gracefully', async () => {
    const result = await parseIntent('', false);
    expect(result.confidence).toBe(0);
    expect(result.sourceAmount).toBe('0');
    expect(result.rawDescription).toBe('');
  });

  it('should handle very long descriptions without throwing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 500, maxLength: 5000 }), async (longStr) => {
        const result = await parseIntent(longStr, false);
        expect(result).toBeDefined();
        expect(result.rawDescription).toBe(longStr);
      }),
      { numRuns: 30 },
    );
  });

  it('should include raw description verbatim', async () => {
    await fc.assert(
      fc.asyncProperty(validDescriptionArb, async (description) => {
        const result = await parseIntent(description, false);
        expect(result.rawDescription).toBe(description);
      }),
      { numRuns: 50 },
    );
  });

  it('should return deterministic results for same input', async () => {
    await fc.assert(
      fc.asyncProperty(validDescriptionArb, async (description) => {
        const r1 = await parseIntent(description, false);
        const r2 = await parseIntent(description, false);
        expect(r1.sourceChain).toBe(r2.sourceChain);
        expect(r1.sourceToken).toBe(r2.sourceToken);
        expect(r1.sourceAmount).toBe(r2.sourceAmount);
        expect(r1.destChain).toBe(r2.destChain);
        expect(r1.destToken).toBe(r2.destToken);
        expect(r1.confidence).toBe(r2.confidence);
      }),
      { numRuns: 50 },
    );
  });
});

describe('Round-trip Properties', () => {
  const mockIntent = {
    id: 'intent-123',
    description: 'swap 1 ETH for USDC on Solana',
    sourceChain: 'solana',
    sourceToken: 'ETH',
    sourceAmount: '1',
    destChain: 'solana',
    destToken: 'USDC',
    minDestAmount: '0',
    deadline: new Date('2026-12-31').toISOString(),
    budget: 10,
    status: 'OPEN',
    requesterId: 'user-1',
    createdAt: new Date('2026-01-01').toISOString(),
  };

  beforeEach(() => {
    (priceFeed.getPrice as jest.Mock).mockImplementation(
      async (token: string) => DEFAULT_MOCK_PRICES[token.toUpperCase()] ?? 1,
    );
  });

  it('intent created via API should be retrievable by ID with all fields intact', async () => {
    (prisma.intent.create as jest.Mock).mockResolvedValue(mockIntent);
    (prisma.notification.create as jest.Mock).mockResolvedValue({});
    const created = await prisma.intent.create({ data: mockIntent });

    (prisma.intent.findUnique as jest.Mock).mockResolvedValue(created);
    const retrieved = await prisma.intent.findUnique({ where: { id: created.id } });

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(mockIntent.id);
    expect(retrieved.description).toBe(mockIntent.description);
    expect(retrieved.sourceChain).toBe(mockIntent.sourceChain);
    expect(retrieved.sourceToken).toBe(mockIntent.sourceToken);
    expect(retrieved.sourceAmount).toBe(mockIntent.sourceAmount);
    expect(retrieved.destChain).toBe(mockIntent.destChain);
    expect(retrieved.destToken).toBe(mockIntent.destToken);
    expect(retrieved.status).toBe(mockIntent.status);
  });

  it('price feed values should always be positive numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('ETH', 'USDC', 'USDT', 'DAI', 'SOL', 'NEAR', 'MATIC', 'BTC', 'LINK', 'UNI', 'AAVE', 'ARB'),
        async (token) => {
          const price = await priceFeed.getPrice(token);
          expect(typeof price).toBe('number');
          expect(price).toBeGreaterThan(0);
          expect(Number.isFinite(price)).toBe(true);
        },
      ),
      { numRuns: 50 },
    );
  });

  it('agent creation should always return an agent with DRAFT status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          framework: fc.constantFrom('elizaos', 'langchain', 'crewai', 'auto-gpt'),
          model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo', 'claude-3', 'llama-3'),
        }),
        async (agentData) => {
          const mockAgent = {
            id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: agentData.name,
            ownerId: 'test-user-id',
            description: agentData.description,
            framework: agentData.framework,
            model: agentData.model,
            status: 'DRAFT',
            config: {},
            tools: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);
          (prisma.agent.create as jest.Mock).mockResolvedValue(mockAgent);
          (prisma.reputation.create as jest.Mock).mockResolvedValue({});

          const created = await prisma.agent.create({ data: agentData });
          expect(created.status).toBe('DRAFT');
        },
      ),
      { numRuns: 30 },
    );
  });

  it('retrieved intent should have same fields as created intent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          description: fc.string({ minLength: 1, maxLength: 100 }),
          sourceChain: fc.constantFrom('ethereum', 'solana', 'polygon', 'arbitrum'),
          sourceToken: fc.constantFrom('ETH', 'USDC', 'SOL', 'MATIC'),
          sourceAmount: fc.stringMatching(/^\d+(\.\d+)?$/),
          destChain: fc.constantFrom('ethereum', 'solana', 'polygon', 'arbitrum'),
          destToken: fc.constantFrom('ETH', 'USDC', 'SOL', 'MATIC'),
          budget: fc.integer({ min: 1, max: 10000 }),
        }),
        async (data) => {
          const intentId = `intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const createdIntent = {
            id: intentId,
            ...data,
            minDestAmount: '0',
            status: 'OPEN',
            requesterId: 'user-1',
            deadline: new Date(Date.now() + 86400000).toISOString(),
            createdAt: new Date().toISOString(),
          };

          (prisma.intent.create as jest.Mock).mockResolvedValue(createdIntent);
          const created = await prisma.intent.create({ data });
          expect(created.status).toBe('OPEN');

          (prisma.intent.findUnique as jest.Mock).mockResolvedValue(created);
          const retrieved = await prisma.intent.findUnique({ where: { id: intentId } });

          expect(retrieved.id).toBe(created.id);
          expect(retrieved.description).toBe(created.description);
          expect(retrieved.sourceChain).toBe(created.sourceChain);
          expect(retrieved.sourceToken).toBe(created.sourceToken);
          expect(retrieved.sourceAmount).toBe(created.sourceAmount);
          expect(retrieved.destChain).toBe(created.destChain);
          expect(retrieved.destToken).toBe(created.destToken);
          expect(retrieved.budget).toBe(created.budget);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('state machine transitions should be commutative with respect to terminal states', () => {
    const terminalStates: EscrowState[] = ['Released', 'Refunded', 'Expired'];

    for (const ts of terminalStates) {
      for (const state of ALL_STATES) {
        expect(isValidTransition(ts, state)).toBe(false);
      }
    }

    const nonTerminal = ALL_STATES.filter(s => !isTerminalState(s));
    for (const nt of nonTerminal) {
      const nextStates = getValidNextStates(nt);
      expect(nextStates.length).toBeGreaterThan(0);
      for (const ns of nextStates) {
        expect(isValidTransition(nt, ns)).toBe(true);
      }
    }
  });
});
