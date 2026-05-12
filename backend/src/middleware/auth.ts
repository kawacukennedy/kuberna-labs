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
  logger.warn('JWT_REFRESH_SECRET not set - using derived secret. Set it explicitly for production.');
}

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
    const decoded = jwt.verify(token, secret) as unknown as UserPayload;

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
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as UserPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, roles: true },
    });

    if (user) {
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
    expiresIn: '7d',
  } as SignOptions);
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: '30d',
  } as SignOptions);
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, getJwtSecret()) as unknown as UserPayload;
};
