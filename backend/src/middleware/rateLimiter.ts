import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Redis from 'ioredis';
import logger from '../utils/logger';

let redis: Redis | null = null;
let redisAvailable = false;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    redisAvailable = false;
    logger.error('Redis connection error', { error: err.message });
  });

  redis.on('ready', () => {
    redisAvailable = true;
    logger.info('Redis connected for rate limiting');
  });
} catch (error) {
  logger.warn('Redis not available, rate limiting disabled', { error: String(error) });
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitInfo {
  total: number;
  remaining: number;
  resetTime: Date;
}

declare global {
  namespace Express {
    interface Request {
      rateLimit?: RateLimitInfo;
    }
  }
}

/**
 * In-memory fallback used whenever Redis is unavailable.
 *
 * Without this the limiter fails OPEN: a missing/unreachable Redis instance
 * (the default REDIS_URL points at localhost and is usually absent in
 * self-hosted deployments) would silently disable every limit, including the
 * brute-force protection on the auth routes. The fallback keeps limits
 * enforcing locally so a Redis outage cannot be used to bypass them.
 */
interface MemoryBucket {
  count: number;
  resetAt: number;
}

const MEMORY_MAX_BUCKETS = 10_000;
const memoryBuckets = new Map<string, MemoryBucket>();

function memoryLimiterCheck(key: string, windowMs: number, maxRequests: number): number {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });

    if (memoryBuckets.size > MEMORY_MAX_BUCKETS) {
      // Drop expired buckets first; if still over the cap, drop the oldest so
      // a burst of unique keys cannot grow memory without bound.
      for (const [k, bucket] of memoryBuckets) {
        if (bucket.resetAt <= now) {
          memoryBuckets.delete(k);
        }
      }
      while (memoryBuckets.size > MEMORY_MAX_BUCKETS) {
        const oldest = memoryBuckets.keys().next();
        if (oldest.done) break;
        memoryBuckets.delete(oldest.value);
      }
    }

    return 1;
  }

  existing.count += 1;
  return existing.count;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, keyGenerator } = options;

  /**
   * Identifies the caller for rate-limiting purposes.
   *
   * `req.ip` is used exclusively. The raw `x-forwarded-for` header is
   * attacker-controlled and must never be trusted directly: reading it here
   * would let anyone rotate the header to obtain a fresh bucket per request
   * and bypass every limit. When running behind a proxy, Express must be
   * configured with `app.set('trust proxy', ...)` so that `req.ip` resolves
   * the forwarded client address through the trusted hop.
   */
  const defaultKeyGenerator = (req: Request): string => {
    return req.ip || 'unknown';
  };

  const getKey = keyGenerator || defaultKeyGenerator;

  const sendTooManyRequests = (res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
      },
    });
  };

  const setRateLimitHeaders = (res: Response, total: number, resetAt: number) => {
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - total).toString());
    res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString());
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${getKey(req)}`;
    const now = Date.now();

    if (!redis || !redisAvailable) {
      const total = memoryLimiterCheck(key, windowMs, maxRequests);
      const bucket = memoryBuckets.get(key)!;

      req.rateLimit = {
        total,
        remaining: Math.max(0, maxRequests - total),
        resetTime: new Date(bucket.resetAt),
      };
      setRateLimitHeaders(res, total, bucket.resetAt);

      if (total > maxRequests) {
        return sendTooManyRequests(res);
      }

      return next();
    }

    const windowStart = now - windowMs;

    try {
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now.toString(), `${now}-${crypto.randomUUID()}`);
      pipeline.zcard(key);
      pipeline.pexpire(key, windowMs);
      const results = await pipeline.exec();

      if (!results) {
        return next();
      }

      const total = results[2][1] as number;
      const resetTime = new Date(now + windowMs);

      req.rateLimit = {
        total,
        remaining: Math.max(0, maxRequests - total),
        resetTime,
      };

      setRateLimitHeaders(res, total, now + windowMs);

      if (total > maxRequests) {
        return sendTooManyRequests(res);
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error, falling back to in-memory limiter', { error: String(error) });

      const total = memoryLimiterCheck(key, windowMs, maxRequests);
      const bucket = memoryBuckets.get(key)!;

      req.rateLimit = {
        total,
        remaining: Math.max(0, maxRequests - total),
        resetTime: new Date(bucket.resetAt),
      };
      setRateLimitHeaders(res, total, bucket.resetAt);

      if (total > maxRequests) {
        return sendTooManyRequests(res);
      }

      next();
    }
  };
};

export const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

export const intentLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyGenerator: (req) => `intent:${req.user?.id || req.ip}`,
});
