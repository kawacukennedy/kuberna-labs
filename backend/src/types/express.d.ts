import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
      params?: Record<string, string>;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    }
  }
}

export type AuthRequest = Request;
