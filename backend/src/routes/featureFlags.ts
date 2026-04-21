import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/express.d.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

const featureFlagSchema = z.object({
  name: z.string().min(1).max(100),
  enabled: z.boolean(),
  description: z.string().optional(),
  rules: z.record(z.unknown()).optional(),
});

router.get(
  '/feature-flags',
  authenticate,
  requireRoles('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const flags = await prisma.featureFlag.findMany({
        orderBy: { name: 'asc' },
      });
      res.json(flags);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/feature-flags/:name',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      
      const flag = await prisma.featureFlag.findUnique({
        where: { name },
      });

      if (!flag) {
        res.json({ enabled: false, name });
        return;
      }

      res.json(flag);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/feature-flags',
  authenticate,
  requireRoles('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = featureFlagSchema.parse(req.body);

      const flag = await prisma.featureFlag.upsert({
        where: { name: data.name },
        update: {
          enabled: data.enabled,
          description: data.description,
          rules: data.rules as object | undefined,
        },
        create: {
          name: data.name,
          enabled: data.enabled,
          description: data.description,
          rules: data.rules as object | undefined,
          createdBy: req.user!.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'FEATURE_FLAG_UPDATED',
          resource: 'featureFlag',
          resourceId: flag.id,
          details: data as object,
        },
      });

      res.json(flag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(createError('Validation error', 400, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  }
);

router.patch(
  '/feature-flags/:name',
  authenticate,
  requireRoles('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      const { enabled, rules } = req.body;

      const flag = await prisma.featureFlag.update({
        where: { name },
        data: {
          ...(enabled !== undefined && { enabled }),
          ...(rules !== undefined && { rules }),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'FEATURE_FLAG_UPDATED',
          resource: 'featureFlag',
          resourceId: flag.id,
          details: { enabled, rules },
        },
      });

      res.json(flag);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/feature-flags/:name',
  authenticate,
  requireRoles('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;

      await prisma.featureFlag.delete({
        where: { name },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'FEATURE_FLAG_DELETED',
          resource: 'featureFlag',
          resourceId: name,
        },
      });

      res.json({ message: 'Feature flag deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export const featureFlagRouter = router;
