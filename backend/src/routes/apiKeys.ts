import { Router, Response, NextFunction } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()),
  expiresAt: z.string().datetime().optional(),
});

router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [apiKeys, total] = await Promise.all([
        prisma.apiKey.findMany({
          where: { userId: req.user!.id },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
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
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
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

      const key = crypto.randomBytes(32).toString("hex");
      const keyPrefix = key.substring(0, 8);
      const keyHash = crypto.createHash("sha256").update(key).digest("hex");

      const apiKey = await prisma.apiKey.create({
        data: {
          userId: req.user!.id,
          name: data.name,
          key: `kn_${keyPrefix}_${keyHash}`,
          permissions: data.permissions,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });

      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key: `kn_${keyPrefix}_${key}`,
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

      const key = crypto.randomBytes(32).toString("hex");
      const keyPrefix = key.substring(0, 8);
      const keyHash = crypto.createHash("sha256").update(key).digest("hex");

      const updated = await prisma.apiKey.update({
        where: { id },
        data: {
          key: `kn_${keyPrefix}_${keyHash}`,
        },
      });

      res.json({
        id: updated.id,
        name: updated.name,
        key: `kn_${keyPrefix}_${key}`,
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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { key } = req.body;

      if (!key) {
        throw createError("API key required", 400, "MISSING_KEY");
      }

      const keyHash = crypto.createHash("sha256").update(key).digest("hex");
      const fullKey = key.startsWith("kn_") ? key : `kn_${key}`;

      const parts = fullKey.split("_");
      if (parts.length < 3) {
        throw createError("Invalid API key format", 400, "INVALID_KEY");
      }

      const prefix = `${parts[1]}_${parts[2]}`;
      const actualKey = parts.slice(3).join("_");
      const lookupKey = `kn_${prefix}_${crypto.createHash("sha256").update(actualKey).digest("hex").substring(0, 64)}`;

      const apiKey = await prisma.apiKey.findFirst({
        where: {
          key: { contains: keyHash.substring(0, 20) },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

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
