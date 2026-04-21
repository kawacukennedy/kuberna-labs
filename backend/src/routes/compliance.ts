import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/express.d.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

const complianceReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['pdf', 'csv', 'json']).optional().default('json'),
  includePayments: z.boolean().optional().default(true),
  includeTasks: z.boolean().optional().default(true),
  includeAgents: z.boolean().optional().default(true),
  anonymize: z.boolean().optional().default(false),
});

router.get(
  '/reports/compliance',
  authenticate,
  requireRoles('ADMIN', 'ENTERPRISE'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = complianceReportSchema.parse(req.query);
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      const [payments, tasks, agents, enrollments] = await Promise.all([
        data.includePayments
          ? prisma.payment.findMany({
              where: {
                createdAt: { gte: startDate, lte: endDate },
              },
              select: data.anonymize
                ? { id: true, amount: true, currency: true, type: true, status: true, createdAt: true }
                : { id: true, amount: true, currency: true, type: true, status: true, createdAt: true },
            })
          : Promise.resolve([]),
        data.includeTasks
          ? prisma.task.findMany({
              where: {
                createdAt: { gte: startDate, lte: endDate },
              },
              select: data.anonymize
                ? { id: true, status: true, createdAt: true, completedAt: true }
                : {
                    id: true,
                    status: true,
                    result: true,
                    proof: true,
                    createdAt: true,
                    completedAt: true,
                    intent: { select: { description: true } },
                  },
            })
          : Promise.resolve([]),
        data.includeAgents
          ? prisma.agent.findMany({
              where: {
                createdAt: { gte: startDate, lte: endDate },
              },
              select: data.anonymize
                ? { id: true, name: true, framework: true, status: true, createdAt: true }
                : { id: true, name: true, framework: true, status: true, createdAt: true },
            })
          : Promise.resolve([]),
        prisma.enrollment.findMany({
          where: {
            enrolledAt: { gte: startDate, lte: endDate },
          },
          select: data.anonymize
            ? { id: true, status: true, enrolledAt: true }
            : { id: true, status: true, enrolledAt: true },
        }),
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
        summary: {
          totalPayments: payments.length,
          totalTasks: tasks.length,
          totalAgents: agents.length,
          totalEnrollments: enrollments.length,
        },
        payments,
        tasks,
        agents,
        enrollments,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.json"`);
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(createError('Validation error', 400, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  }
);

router.get(
  '/reports/revenue',
  authenticate,
  requireRoles('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { period = '30d', startDate, endDate } = req.query;

      let startDateObj: Date;
      const now = new Date();

      switch (period) {
        case '7d':
          startDateObj = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDateObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDateObj = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDateObj = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          startDateObj = startDate ? new Date(startDate as string) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDateObj = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const endDateObj = endDate ? new Date(endDate as string) : now;

      const [payments, intents, tasks, enrollments, subscriptions] = await Promise.all([
        prisma.payment.findMany({
          where: {
            createdAt: { gte: startDateObj, lte: endDateObj },
            status: 'COMPLETED',
          },
        }),
        prisma.intent.findMany({
          where: {
            createdAt: { gte: startDateObj, lte: endDateObj },
            status: { in: ['COMPLETED', 'ASSIGNED', 'EXECUTING'] },
          },
        }),
        prisma.task.findMany({
          where: {
            createdAt: { gte: startDateObj, lte: endDateObj },
            status: 'COMPLETED',
          },
        }),
        prisma.enrollment.findMany({
          where: {
            enrolledAt: { gte: startDateObj, lte: endDateObj },
            status: 'ACTIVE',
          },
        }),
        prisma.subscription.findMany({
          where: {
            createdAt: { gte: startDateObj, lte: endDateObj },
          },
        }),
      ]);

      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const revenueByCurrency = payments.reduce(
        (acc, p) => {
          acc[p.currency] = (acc[p.currency] || 0) + Number(p.amount);
          return acc;
        },
        {} as Record<string, number>
      );

      const revenueByType = payments.reduce(
        (acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + Number(p.amount);
          return acc;
        },
        {} as Record<string, number>
      );

      const dailyRevenue = payments.reduce((acc, p) => {
        const date = p.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + Number(p.amount);
        return acc;
      }, {} as Record<string, number>);

      res.json({
        period: { start: startDateObj.toISOString(), end: endDateObj.toISOString() },
        summary: {
          totalRevenue,
          revenueByCurrency,
          revenueByType,
          totalIntents: intents.length,
          completedTasks: tasks.length,
          activeEnrollments: enrollments.length,
          subscriptions: subscriptions.length,
        },
        dailyRevenue,
        payments: payments.slice(0, 100),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/reports/activity',
  authenticate,
  requireRoles('ADMIN'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { period = '30d' } = req.query;
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const [totalUsers, newUsers, activeUsers, totalAgents, activeAgents, completedTasks] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: startDate } } }),
        prisma.user.count({ where: { createdAt: { gte: startDate } } }),
        prisma.user.count({
          where: {
            OR: [
              { lastLogin: { gte: startDate } },
              { agents: { some: { lastActive: { gte: startDate } } } },
              { intents: { some: { createdAt: { gte: startDate } } } },
            ],
          },
        }),
        prisma.agent.count(),
        prisma.agent.count({ where: { status: { in: ['RUNNING', 'DEPLOYED'] } } }),
        prisma.task.count({ where: { status: 'COMPLETED', completedAt: { gte: startDate } } }),
      ]);

      const dailyNewUsers = await prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      });

      res.json({
        period: { start: startDate.toISOString(), end: now.toISOString() },
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
        },
        agents: {
          total: totalAgents,
          active: activeAgents,
        },
        tasks: {
          completed: completedTasks,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export const complianceRouter = router;
