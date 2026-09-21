import express, { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger.js';

/**
 * CryptoPulse delivers webhooks as an envelope:
 *
 *   { "event": "whale_move", "timestamp": <unix seconds>, "data": { ... } }
 *
 * The event-specific fields live under `data`, NOT at the top level. The
 * confirmed `whale_move` shape (CryptoPulse, 2026-09-20) is:
 *
 *   data: { alertId, alertType, chain, chainName, token, tokenSymbol,
 *           amount, usdValue, wallet, walletLabel, counterparty, hash,
 *           explorerUrl }
 *
 * Note what is absent: there is no `direction`, no base-unit `amountRaw`, and
 * the label is on the watched `wallet` only (the counterparty is unlabelled).
 * Until CryptoPulse adds `direction` we deliberately keep `wallet` and
 * `counterparty` as-is rather than guessing which side is `from`/`to`.
 */
export interface CryptoPulseEvent {
  event?: unknown;
  timestamp?: unknown;
  data?: unknown;
  [k: string]: unknown;
}

interface NormalizedEvent {
  receivedAt: string;
  source: 'cryptopulse';
  monitored: boolean;
  event: Record<string, unknown>;
}

const MONITORED_EVENTS = new Set(['whale_move']);

/** Envelope fields that must be present on a monitored event for us to accept it. */
const REQUIRED_DATA_FIELDS = ['chain', 'hash', 'wallet', 'counterparty'] as const;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

function toString(v: unknown): string | undefined {
  return v === undefined || v === null ? undefined : String(v);
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function normalizeTimestamp(v: unknown): string {
  const s = toString(v);
  if (s === undefined) return new Date().toISOString();
  const n = Number(s);
  const ms = Number.isFinite(n) && s.trim() !== '' ? (n > 1e11 ? n : n * 1000) : NaN;
  const d = Number.isFinite(ms) ? new Date(ms) : new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function parseSignatureHeader(header: string | undefined): { timestamp?: string; signature?: string } {
  if (!header) return {};
  let timestamp: string | undefined;
  let signature: string | undefined;
  for (const part of header.split(',')) {
    const pair = part.split('=');
    const key = pair[0]?.trim().toLowerCase();
    const value = pair.slice(1).join('=').trim();
    if (key === 't') timestamp = value;
    if (key === 'v1' || key === 'sha256' || key === 'sig') signature = value;
  }
  if (signature === undefined && !header.includes('=')) signature = header;
  return { timestamp, signature };
}

interface SignatureAssertion {
  ok: boolean;
  category?: 'missing' | 'malformed' | 'replay' | 'mismatch';
}

function verifySignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  secret: string
): SignatureAssertion {
  if (!signatureHeader || signatureHeader.trim() === '') {
    return { ok: false, category: 'missing' };
  }
  const { timestamp: sigTimestamp, signature } = parseSignatureHeader(signatureHeader);
  const timestamp = timestampHeader ?? sigTimestamp;
  if (!signature) return { ok: false, category: 'malformed' };
  if (!timestamp) return { ok: false, category: 'malformed' };
  const tsNum = Number(timestamp.trim());
  if (!Number.isFinite(tsNum)) return { ok: false, category: 'malformed' };
  const tsMs = tsNum > 1e11 ? tsNum : tsNum * 1000;
  const skewMs = Math.abs(Date.now() - tsMs);
  // CryptoPulse does not reject stale deliveries on its side — this window is
  // ours to enforce and is the only freshness guard on the path.
  if (skewMs > 5 * 60_000) return { ok: false, category: 'replay' };
  // Verify over the exact bytes CryptoPulse signed: "<timestamp>.<raw body>".
  const expected = crypto
    .createHmac('sha256', secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), rawBody]))
    .digest('hex');
  const provided = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (provided.length !== want.length) return { ok: false, category: 'mismatch' };
  if (!crypto.timingSafeEqual(provided, want)) return { ok: false, category: 'mismatch' };
  return { ok: true };
}

function validateEvent(body: CryptoPulseEvent): { ok: boolean; error?: string; eventName?: string } {
  if (!asRecord(body)) {
    return { ok: false, error: 'body must be a JSON object' };
  }
  if (typeof body.event !== 'string' || body.event.trim() === '') {
    return { ok: false, error: 'missing or invalid "event" field' };
  }
  const eventName = body.event;
  if (MONITORED_EVENTS.has(eventName)) {
    const data = asRecord(body.data);
    if (!data) {
      return { ok: false, error: `missing "data" object for ${eventName}` };
    }
    for (const field of REQUIRED_DATA_FIELDS) {
      if (toString(data[field]) === undefined) {
        return { ok: false, error: `missing required field "data.${field}" for ${eventName}` };
      }
    }
  }
  return { ok: true, eventName };
}

function normalize(body: CryptoPulseEvent, deliveryId?: string): NormalizedEvent {
  const eventName = String(body.event);
  const data = asRecord(body.data) ?? {};
  return {
    receivedAt: new Date().toISOString(),
    source: 'cryptopulse',
    monitored: MONITORED_EVENTS.has(eventName),
    event: {
      event: eventName,
      alertId: toString(data.alertId),
      alertType: toString(data.alertType),
      // Unique per delivery attempt (X-CryptoPulse-Delivery); useful for
      // de-duplicating retries once persistence lands.
      deliveryId: deliveryId,
      timestamp: normalizeTimestamp(body.timestamp),
      chain: toString(data.chain),
      chainName: toString(data.chainName),
      // CryptoPulse calls the tx hash `hash`; keep the canonical field name.
      txHash: toString(data.hash),
      wallet: toString(data.wallet),
      walletLabel: toString(data.walletLabel),
      counterparty: toString(data.counterparty),
      token: toString(data.token),
      tokenSymbol: toString(data.tokenSymbol),
      amount: toNumber(data.amount),
      usdValue: toNumber(data.usdValue),
      explorerUrl: toString(data.explorerUrl),
    },
  };
}

function eventsPath(): string {
  return path.resolve(
    process.env.CRYPTOPULSE_EVENTS_PATH ||
      path.join(__dirname, '..', '..', '..', 'reports', 'cryptopulse-events.jsonl')
  );
}

function appendSink(record: NormalizedEvent): void {
  const file = eventsPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(record) + '\n');
}

export const cryptopulseRouter: Router = express.Router();

cryptopulseRouter.post(
  '/cryptopulse',
  express.raw({ type: () => true, limit: '1mb' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = process.env.CRYPTOPULSE_WEBHOOK_SECRET;
      if (!secret) {
        logger.error('CRYPTOPULSE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook configuration error' });
      }

      const body = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
      const signatureHeader = req.headers['x-cryptopulse-signature'] as string | undefined;
      const timestampHeader = req.headers['x-cryptopulse-timestamp'] as string | undefined;
      const deliveryId = req.headers['x-cryptopulse-delivery'] as string | undefined;

      const verified = verifySignature(body, signatureHeader, timestampHeader, secret);
      if (!verified.ok) {
        logger.warn(`cryptopulse webhook rejected: ${verified.category}`);
        const status = verified.category === 'missing' || verified.category === 'malformed' ? 400 : 401;
        return res.status(status).json({ error: 'invalid_signature', detail: verified.category });
      }

      let payload: unknown;
      try {
        payload = JSON.parse(body.toString('utf8'));
      } catch {
        return res.status(400).json({ error: 'invalid_json' });
      }

      const validated = validateEvent(payload as CryptoPulseEvent);
      if (!validated.ok) {
        logger.warn(`cryptopulse webhook validation failed: ${validated.error}`);
        return res.status(400).json({ error: 'validation_failed', detail: validated.error });
      }

      const record = normalize(payload as CryptoPulseEvent, deliveryId);
      appendSink(record);
      logger.info(`cryptopulse webhook accepted (${validated.eventName}, monitored=${record.monitored})`);

      return res.status(200).json({ received: true, monitored: record.monitored });
    } catch (err) {
      next(err);
    }
  }
);
