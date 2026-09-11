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

const validEvent = {
  event: 'whale_move',
  eventId: 'evt-test-001',
  timestamp: '1788960000',
  txHash: '0x' + 'ab'.repeat(32),
  block: 22000000,
  chain: 'base',
  direction: 'in',
  from: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  fromLabel: 'uniswap-router',
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  toLabel: 'vitalik.eth',
  token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  amountRaw: '1500000000000000000000',
  amountUsd: 1450.25,
};

function rawRequest(app: express.Express, body: object) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = JSON.stringify(body);
  const signature = sign(payload, timestamp);
  return request(app)
    .post('/hooks/cryptopulse')
    .set('Content-Type', 'application/json')
    .set('X-CryptoPulse-Timestamp', timestamp)
    .set('X-CryptoPulse-Signature', `v1=${signature}`)
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
    expect(record.event.txHash).toBe(validEvent.txHash);
    expect(record.event.amountUsd).toBe(1450.25);
    expect(record.event.amountRaw).toBe(validEvent.amountRaw);
    expect(record.event.toLabel).toBe('vitalik.eth');
  });

  it('rejects a tampered body (signature mismatch)', async () => {
    const app = createApp();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = JSON.stringify(validEvent);
    const signature = sign(payload, timestamp);
    const tampered = JSON.stringify({ ...validEvent, amountUsd: 999999 });
    await request(app)
      .post('/hooks/cryptopulse')
      .set('Content-Type', 'application/json')
      .set('X-CryptoPulse-Timestamp', timestamp)
      .set('X-CryptoPulse-Signature', `v1=${signature}`)
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
      .set('X-CryptoPulse-Signature', `v1=${signature}`)
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
    const incomplete = { ...validEvent };
    delete (incomplete as Record<string, unknown>).txHash;
    await rawRequest(app, incomplete).expect(400);
  });

  it('accepts and marks unmonitored-but-valid events as not monitored', async () => {
    const app = createApp();
    const walletWatch = {
      event: 'wallet_watch',
      eventId: 'evt-test-002',
      timestamp: '1788960000',
      chain: 'base',
      address: '0x' + 'cd'.repeat(20),
      note: 'monitored address activity',
    };
    const res = await rawRequest(app, walletWatch).expect(200);
    expect(res.body).toEqual({ received: true, monitored: false });
    const record = JSON.parse(fs.readFileSync(path.join(sinkDir, 'events.jsonl'), 'utf8').trim().split('\n')[0]);
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
      .set('X-CryptoPulse-Signature', `v1=${signature}`)
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