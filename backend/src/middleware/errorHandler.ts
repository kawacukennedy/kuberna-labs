import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_ERROR',
    };
    return codes[statusCode] || 'ERROR';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export function errorHandler(err: ApiError, req: Request, res: Response, _next: NextFunction) {
  // Routes call schema.parse() directly, so an invalid body reaches the error
  // handler as a ZodError. Without this branch that surfaced as a generic 500
  // and the client could not tell which field was wrong.
  if (err instanceof ZodError) {
    const details = err.errors.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));

    logger.warn('VALIDATION_ERROR', {
      path: req.path,
      method: req.method,
      fields: details.map((detail) => detail.field),
    });

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      },
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`${err.code || 'UNKNOWN'}: ${message}`, {
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code,
      ...(err.details !== undefined && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

export function createError(message: string, statusCode: number, code?: string): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
