import { Router, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get(
  "/overview",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { period = "30d" } = req.query;
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        totalAgents,
        activeAgents,
        totalIntents,
        completedTasks,
        totalRevenue,
        newEnrollments,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastLogin: { gte: startDate } } }),
        prisma.agent.count(),
        prisma.agent.count({ where: { status: "RUNNING" } }),
        prisma.intent.count({ where: { createdAt: { gte: startDate } } }),
        prisma.task.count({
          where: { status: "COMPLETED", completedAt: { gte: startDate } },
        }),
        prisma.payment.aggregate({
          where: { status: "COMPLETED", createdAt: { gte: startDate } },
          _sum: { amount: true },
        }),
        prisma.enrollment.count({ where: { enrolledAt: { gte: startDate } } }),
      ]);

      res.json({
        users: { total: totalUsers, active: activeUsers },
        agents: { total: totalAgents, active: activeAgents },
        intents: { total: totalIntents },
        tasks: { completed: completedTasks },
        revenue: { total: totalRevenue._sum.amount || 0 },
        enrollments: { new: newEnrollments },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/revenue",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { period = "30d" } = req.query;
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const payments = await prisma.payment.findMany({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        select: { amount: true, createdAt: true, currency: true },
      });

      const dailyRevenue: Record<string, number> = {};
      for (const payment of payments) {
        const date = payment.createdAt.toISOString().split("T")[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(payment.amount);
      }

      res.json(
        Object.entries(dailyRevenue).map(([date, amount]) => ({
          date,
          amount,
        })),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/users",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { period = "30d" } = req.query;
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const users = await prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      });

      const dailyUsers: Record<string, number> = {};
      for (const user of users) {
        const date = user.createdAt.toISOString().split("T")[0];
        dailyUsers[date] = (dailyUsers[date] || 0) + 1;
      }

      res.json(
        Object.entries(dailyUsers).map(([date, count]) => ({ date, count })),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/agents",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, framework } = req.query;
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (framework) where.framework = framework;

      const agents = await prisma.agent.findMany({
        where,
        select: { status: true, framework: true, createdAt: true },
      });

      res.json({
        byStatus: agents.reduce(
          (acc: Record<string, number>, a: { status: string; framework: string; createdAt: Date }) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byFramework: agents.reduce(
          (acc: Record<string, number>, a: { status: string; framework: string; createdAt: Date }) => {
            acc[a.framework] = (acc[a.framework] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/tasks",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { period = "30d" } = req.query;
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const tasks = await prisma.task.findMany({
        where: { createdAt: { gte: startDate } },
        select: { status: true, createdAt: true },
      });

      res.json({
        byStatus: tasks.reduce(
          (acc: Record<string, number>, t: { status: string; createdAt: Date }) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

export const analyticsRouter = router;
