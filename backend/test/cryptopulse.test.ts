import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { cryptopulseRouter } from '../src/routes/cryptopulse';

process.env.CRYPTOPULSE_WEBHOOK_SECRET = 'test-cryptopulse-secret';
const sinkDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cryptopulse-test-'));
process.env.CRYPTOPULSE_EVENTS_PATH = path.join(sinkDir, 'events.jsonl');

beforeAll(() => {
  process.env.CRYPTOPULSE_WEBHOOK_SECRET = 'test-cryptopulse-secret';
  process.env.CRYPTOPULSE_EVENTS_PATH = path.join(sinkDir, 'events.jsonl');
});

const SECRET = 'test-cryptopulse-secret';
const DELIVERY_ID = 'delivery-test-001';

function sign(body: string, timestamp: string): string {
  return crypto.createHmac('sha256', SECRET).update(`${timestamp}.${body}`).digest('hex');
}

function createApp() {
  const app = express();
  app.use('/hooks', cryptopulseRouter);
  app.use(express.json());
  const appErrorHandler: ErrorRequestHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    res.status(500).json({ error: err.message ?? 'internal' });
  };
  app.use(appErrorHandler);
  return app;
}

const validData = {
  alertId: 'alert-test-001',
  alertType: 'whale_move',
  chain: 'base',
  chainName: 'Base',
  token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  tokenSymbol: 'USDC',
  amount: 1500.0,
  usdValue: 1450.25,
  wallet: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  walletLabel: 'Wintermute',
  counterparty: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  hash: '0x' + 'ab'.repeat(32),
  explorerUrl: 'https://etherscan.io/tx/0x' + 'ab'.repeat(32),
};

// The real CryptoPulse envelope: event metadata at the top level, the
// event-specific fields under `data`.
const validEvent = {
  event: 'whale_move',
  timestamp: 1788960000,
  data: validData,
};

function rawRequest(app: express.Express, body: object, deliveryId = DELIVERY_ID) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = JSON.stringify(body);
  const signature = sign(payload, timestamp);
  return request(app)
    .post('/hooks/cryptopulse')
    .set('Content-Type', 'application/json')
    .set('X-CryptoPulse-Timestamp', timestamp)
    .set('X-CryptoPulse-Signature', `sha256=${signature}`)
    .set('X-CryptoPulse-Delivery', deliveryId)
    .send(payload);
}

describe('cryptopulse webhook receiver', () => {
  afterEach(() => {
    fs.writeFileSync(path.join(sinkDir, 'events.jsonl'), '');
  });

  it('accepts a valid signed whale_move and appends a normalized line', async () => {
    const app = createApp();
    const res = await rawRequest(app, validEvent).expect(200);
    expect(res.body).toEqual({ received: true, monitored: true });

    const line = fs.readFileSync(path.join(sinkDir, 'events.jsonl'), 'utf8').trim().split('\n');
    expect(line.length).toBe(1);
    const record = JSON.parse(line[0]);
    expect(record.source).toBe('cryptopulse');
    expect(record.monitored).toBe(true);
    expect(record.event.event).toBe('whale_move');
    expect(record.event.txHash).toBe(validData.hash);
    expect(record.event.chain).toBe('base');
    expect(record.event.wallet).toBe(validData.wallet);
    expect(record.event.walletLabel).toBe('Wintermute');
    expect(record.event.counterparty).toBe(validData.counterparty);
    expect(record.event.amount).toBe(1500.0);
    expect(record.event.usdValue).toBe(1450.25);
    expect(record.event.alertId).toBe('alert-test-001');
    expect(record.event.deliveryId).toBe(DELIVERY_ID);
    expect(record.event.timestamp).toBe(new Date(1788960000 * 1000).toISOString());
    // The old draft had from/to/direction/amountRaw; the real payload has none.
    expect(record.event.direction).toBeUndefined();
    expect(record.event.from).toBeUndefined();
    expect(record.event.to).toBeUndefined();
    expect(record.event.amountRaw).toBeUndefined();
  });

  it('rejects the old flat draft shape (fields not nested under data)', async () => {
    const app = createApp();
    const flatDraft = {
      event: 'whale_move',
      eventId: 'evt-old-draft',
      timestamp: '1788960000',
      txHash: validData.hash,
      block: 22000000,
      chain: 'base',
      direction: 'in',
      from: validData.wallet,
      to: validData.counterparty,
      amountRaw: '1500000000000000000000',
      amountUsd: 1450.25,
    };
    const res = await rawRequest(app, flatDraft).expect(400);
    expect(res.body.error).toBe('validation_failed');
    expect(res.body.detail).toContain('data');
    expect(fs.readFileSync(path.join(sinkDir, 'events.jsonl'), 'utf8')).toBe('');
  });

  it('rejects a tampered body (signature mismatch)', async () => {
    const app = createApp();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify(validEvent);
    const signature = sign(payload, timestamp);
    const tampered = JSON.stringify({ ...validEvent, data: { ...validData, usdValue: 999999 } });
    await request(app)
      .post('/hooks/cryptopulse')
      .set('Content-Type', 'application/json')
      .set('X-CryptoPulse-Timestamp', timestamp)
      .set('X-CryptoPulse-Signature', `sha256=${signature}`)
      .send(tampered)
      .expect(401);
    expect(fs.readFileSync(path.join(sinkDir, 'events.jsonl'), 'utf8')).toBe('');
  });

  it('rejects a replay outside the 5-minute window', async () => {
    const app = createApp();
    const staleTs = String(Math.floor(Date.now() / 1000) - 6 * 60);
    const payload = JSON.stringify(validEvent);
    const signature = sign(payload, staleTs);
    await request(app)
      .post('/hooks/cryptopulse')
      .set('Content-Type', 'application/json')
      .set('X-CryptoPulse-Timestamp', staleTs)
      .set('X-CryptoPulse-Signature', `sha256=${signature}`)
      .send(payload)
      .expect(401);
  });

  it('rejects a missing signature header', async () => {
    const app = createApp();
    await request(app)
      .post('/hooks/cryptopulse')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(validEvent))
      .expect(400);
  });

  it('rejects when required fields are missing on a monitored event', async () => {
    const app = createApp();
    const incomplete = { ...validEvent, data: { ...validData } };
    delete (incomplete.data as Record<string, unknown>).hash;
    await rawRequest(app, incomplete).expect(400);
  });

  it('accepts and marks unmonitored-but-valid events as not monitored', async () => {
    const app = createApp();
    const walletWatch = {
      event: 'wallet_watch',
      timestamp: 1788960000,
      data: {
        chain: 'base',
        address: '0x' + 'cd'.repeat(20),
        note: 'monitored address activity',
      },
    };
    const res = await rawRequest(app, walletWatch).expect(200);
    expect(res.body).toEqual({ received: true, monitored: false });
    const record = JSON.parse(
      fs.readFileSync(path.join(sinkDir, 'events.jsonl'), 'utf8').trim().split('\n')[0]
    );
    expect(record.monitored).toBe(false);
    expect(record.event.event).toBe('wallet_watch');
  });

  it('rejects malformed JSON', async () => {
    const app = createApp();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const bad = '{ not json';
    const signature = sign(bad, timestamp);
    await request(app)
      .post('/hooks/cryptopulse')
      .set('Content-Type', 'application/json')
      .set('X-CryptoPulse-Timestamp', timestamp)
      .set('X-CryptoPulse-Signature', `sha256=${signature}`)
      .send(bad)
      .expect(400);
  });

  it('rejects a body with no event field', async () => {
    const app = createApp();
    await rawRequest(app, { hello: 'world' }).expect(400);
  });

  it('returns 500 when the secret is not configured', async () => {
    const secret = process.env.CRYPTOPULSE_WEBHOOK_SECRET;
    delete process.env.CRYPTOPULSE_WEBHOOK_SECRET;
    try {
      const app = createApp();
      const res = await rawRequest(app, validEvent).expect(500);
      expect(res.body.error).toBe('Webhook configuration error');
    } finally {
      process.env.CRYPTOPULSE_WEBHOOK_SECRET = secret;
    }
  });
});
