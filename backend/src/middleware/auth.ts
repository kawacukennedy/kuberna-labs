import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "./errorHandler.js";
import { prisma } from "../utils/prisma.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError("No token provided", 401, "NO_TOKEN");
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "kuberna-secret-key";

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      roles: string[];
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, roles: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw createError("User not found", 401, "USER_NOT_FOUND");
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles as string[],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError("Invalid token", 401, "INVALID_TOKEN"));
    } else {
      next(error);
    }
  }
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError("Not authenticated", 401, "NOT_AUTHENTICATED"));
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      return next(createError("Insufficient permissions", 403, "FORBIDDEN"));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "kuberna-secret-key";

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      roles: string[];
    };

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
