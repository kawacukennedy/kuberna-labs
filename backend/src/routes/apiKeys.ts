import { Router, Response, NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const MAX_PAGE_SIZE = 100;

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()),
  expiresAt: z.string().datetime().optional(),
});

/**
 * Generates a raw API key and returns { rawKey, prefix, hash }.
 * The database only ever stores the SHA-256 hash of the raw key.
 */
function generateKeyPair(): { rawKey: string; prefix: string; hash: string } {
  const rawKey = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
  return { rawKey, prefix: rawKey.substring(0, 8), hash };
}

/**
 * Extracts the raw key material from an accepted key string. Keys are issued
 * as `kn_<prefix>_<raw>` but callers may submit either the full form or the
 * bare 64-character hex string.
 */
function extractRawKey(key: string): string | null {
  const candidate = key.startsWith("kn_") ? key.substring(3) : key;
  const rawPart = candidate.split("_").pop() || candidate;

  if (!/^[0-9a-f]{64}$/.test(rawPart)) {
    return null;
  }

  return rawPart;
}

router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || 20));

      const [apiKeys, total] = await Promise.all([
        prisma.apiKey.findMany({
          where: { userId: req.user!.id },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
            permissions: true,
            lastUsedAt: true,
            expiresAt: true,
            createdAt: true,
            key: false,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.apiKey.count({ where: { userId: req.user!.id } }),
      ]);

      res.json({
        apiKeys,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = createApiKeySchema.parse(req.body);

      const { rawKey, prefix, hash } = generateKeyPair();

      const apiKey = await prisma.apiKey.create({
        data: {
          userId: req.user!.id,
          name: data.name,
          key: hash,
          permissions: data.permissions,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });

      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key: `kn_${prefix}_${rawKey}`,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(createError("Validation error", 400, "VALIDATION_ERROR"));
      } else {
        next(error);
      }
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const apiKey = await prisma.apiKey.findUnique({ where: { id } });

      if (!apiKey) {
        throw createError("API key not found", 404, "NOT_FOUND");
      }

      if (apiKey.userId !== req.user!.id) {
        throw createError("Not authorized", 403, "FORBIDDEN");
      }

      await prisma.apiKey.delete({ where: { id } });

      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/rotate",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const apiKey = await prisma.apiKey.findUnique({ where: { id } });

      if (!apiKey) {
        throw createError("API key not found", 404, "NOT_FOUND");
      }

      if (apiKey.userId !== req.user!.id) {
        throw createError("Not authorized", 403, "FORBIDDEN");
      }

      const { rawKey, prefix, hash } = generateKeyPair();

      const updated = await prisma.apiKey.update({
        where: { id },
        data: {
          key: hash,
        },
      });

      res.json({
        id: updated.id,
        name: updated.name,
        key: `kn_${prefix}_${rawKey}`,
        permissions: updated.permissions,
        expiresAt: updated.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/validate",
  apiLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { key } = req.body;

      if (!key || typeof key !== "string") {
        throw createError("API key required", 400, "MISSING_KEY");
      }

      const rawKey = extractRawKey(key);
      if (!rawKey) {
        throw createError("Invalid API key format", 400, "INVALID_KEY");
      }

      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

      const apiKey = await prisma.apiKey.findUnique({
        where: {
          key: keyHash,
        },
      });

      if (apiKey && apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
        throw createError("Invalid or expired API key", 401, "INVALID_KEY");
      }

      if (!apiKey) {
        throw createError("Invalid or expired API key", 401, "INVALID_KEY");
      }

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      const user = await prisma.user.findUnique({
        where: { id: apiKey.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: true,
        },
      });

      res.json({
        valid: true,
        user,
        permissions: apiKey.permissions,
      });
    } catch (error) {
      next(error);
    }
  },
);

export const apiKeyRouter = router;
