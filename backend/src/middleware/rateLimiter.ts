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

export const createRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, keyGenerator, skipSuccessfulRequests = false } = options;

  const defaultKeyGenerator = (req: Request): string => {
    return req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
  };

  const getKey = keyGenerator || defaultKeyGenerator;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis || !redisAvailable) {
      return next();
    }

    const key = `ratelimit:${getKey(req)}`;
    const now = Date.now();
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
