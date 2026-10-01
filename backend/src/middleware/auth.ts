import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import jwt, { JsonWebTokenError, TokenExpiredError, SignOptions } from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';
import { prisma } from '../utils/prisma.js';
import { validateEnvironment } from './envValidation.js';

validateEnvironment();

export interface UserPayload {
  id: string;
  email: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.warn('JWT_SECRET not set - authentication will be disabled');
}

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET ? JWT_SECRET + '_refresh' : undefined);
if (!process.env.JWT_REFRESH_SECRET && process.env.NODE_ENV === 'production') {
  // Never fall back to a JWT_SECRET-derived refresh secret in production: if
  // JWT_SECRET ever leaks, every refresh token signed with the derived value
  // leaks with it. Fail fast instead of running with a weaker guarantee.
  throw new Error(
    'JWT_REFRESH_SECRET must be set explicitly in production (derived fallback is not allowed)'
  );
}

/** Pin the accepted algorithms so a token cannot dictate its own "alg". */
const JWT_ALGORITHM = 'HS256' as const;
const JWT_ALGORITHMS: jwt.Algorithm[] = [JWT_ALGORITHM];

function getJwtSecret(): string {
  if (!JWT_SECRET) throw new UnauthorizedError('Authentication not configured');
  return JWT_SECRET;
}

function getRefreshSecret(): string {
  if (!JWT_REFRESH_SECRET) throw new UnauthorizedError('Authentication not configured');
  return JWT_REFRESH_SECRET;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = getJwtSecret();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secret, { algorithms: JWT_ALGORITHMS }) as unknown as UserPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, roles: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('User not found');
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles as string[],
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else if (error instanceof JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: JWT_ALGORITHMS,
    }) as unknown as UserPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, roles: true, deletedAt: true },
    });

    // Honour soft-deletes on optional auth too, otherwise a deactivated
    // account keeps full privileges on every optionalAuth-protected route.
    if (user && !user.deletedAt) {
      req.user = {
        id: user.id,
        email: user.email,
        roles: user.roles as string[],
      };
    }
  } catch {
    // Token invalid, but continue without auth
  }

  next();
};

export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: '7d',
  } as SignOptions);
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, getRefreshSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: '30d',
  } as SignOptions);
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: JWT_ALGORITHMS,
  }) as unknown as UserPayload;
};
