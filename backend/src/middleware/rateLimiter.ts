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
  logger.warn('Redis not available, falling back to in-memory rate limiting', { error: String(error) });
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

const memoryStore = new Map<string, { timestamps: number[] }>();

function memoryRateCheck(key: string, windowMs: number, maxRequests: number): { total: number; blocked: boolean } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const entry = memoryStore.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);
  if (entry.timestamps.length >= maxRequests) {
    memoryStore.set(key, entry);
    return { total: entry.timestamps.length, blocked: true };
  }
  entry.timestamps.push(now);
  memoryStore.set(key, entry);
  return { total: entry.timestamps.length, blocked: false };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    entry.timestamps = entry.timestamps.filter(t => t > now - 60_000);
    if (entry.timestamps.length === 0) memoryStore.delete(key);
  }
}, 120_000).unref();

export const createRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, keyGenerator } = options;

  const defaultKeyGenerator = (req: Request): string => {
    return req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
  };

  const getKey = keyGenerator || defaultKeyGenerator;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);

    if (!redis || !redisAvailable) {
      const { total, blocked } = memoryRateCheck(`ratelimit:${key}`, windowMs, maxRequests);
      const resetTime = new Date(Date.now() + windowMs);
      req.rateLimit = { total, remaining: Math.max(0, maxRequests - total), resetTime };
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining.toString());
      res.setHeader('X-RateLimit-Reset', resetTime.toISOString());
      if (blocked) {
        res.status(429).json({
          success: false,
          error: { message: 'Too many requests, please try again later', code: 'RATE_LIMIT_EXCEEDED', retryAfter: Math.ceil(windowMs / 1000) },
        });
        return;
      }
      return next();
    }

    const redisKey = `ratelimit:${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zadd(redisKey, now.toString(), `${now}-${crypto.randomUUID()}`);
      pipeline.zcard(redisKey);
      pipeline.pexpire(redisKey, windowMs);
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

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining.toString());
      res.setHeader('X-RateLimit-Reset', resetTime.toISOString());

      if (total > maxRequests) {
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000),
          },
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error', { error: String(error) });
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
