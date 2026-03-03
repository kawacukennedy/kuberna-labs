import { Router, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, unread } = req.query;
      const where: Record<string, unknown> = { userId: req.user!.id };
      if (unread === "true") where.read = false;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.notification.count({ where }),
      ]);

      const unreadCount = await prisma.notification.count({
        where: { userId: req.user!.id, read: false },
      });

      res.json({
        notifications,
        unreadCount,
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
      const { userId, type, title, message, data } = req.body;
      const notification = await prisma.notification.create({
        data: { userId, type, title, message, data },
      });
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/read",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const notification = await prisma.notification.findUnique({
        where: { id },
      });
      if (!notification || notification.userId !== req.user!.id) {
        throw createError("Notification not found", 404, "NOT_FOUND");
      }
      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/read-all",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, read: false },
        data: { read: true },
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const notification = await prisma.notification.findUnique({
        where: { id },
      });
      if (!notification || notification.userId !== req.user!.id) {
        throw createError("Notification not found", 404, "NOT_FOUND");
      }
      await prisma.notification.delete({ where: { id } });
      res.json({ message: "Notification deleted" });
    } catch (error) {
      next(error);
    }
  },
);

export const notificationRouter = router;
