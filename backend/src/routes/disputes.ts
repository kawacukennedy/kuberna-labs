import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = Router();

const resolveDisputeSchema = z.object({
  resolution: z.enum(["requester_refund", "agent_paid"]),
});

router.get(
  "/",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const [disputes, total] = await Promise.all([
        prisma.dispute.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            task: {
              include: {
                intent: {
                  select: {
                    id: true,
                    description: true,
                    requesterId: true,
                  },
                },
                executor: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.dispute.count({ where }),
      ]);

      res.json({
        disputes,
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

router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          task: {
            include: {
              intent: {
                select: {
                  id: true,
                  description: true,
                  requesterId: true,
                  budget: true,
                },
              },
              executor: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!dispute) {
        throw createError("Dispute not found", 404, "NOT_FOUND");
      }

      const isParty =
        dispute.task.intent.requesterId === req.user!.id ||
        dispute.task.executorId === req.user!.id ||
        req.user!.roles.includes("ADMIN");

      if (!isParty) {
        throw createError(
          "Not authorized to view this dispute",
          403,
          "FORBIDDEN",
        );
      }

      res.json(dispute);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/evidence",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { evidence } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          task: {
            include: {
              intent: true,
            },
          },
        },
      });

      if (!dispute) {
        throw createError("Dispute not found", 404, "NOT_FOUND");
      }

      const isParty =
        dispute.task.intent.requesterId === req.user!.id ||
        dispute.task.executorId === req.user!.id;

      if (!isParty) {
        throw createError(
          "Not authorized to submit evidence",
          403,
          "FORBIDDEN",
        );
      }

      if (dispute.status !== "OPEN") {
        throw createError(
          "Dispute is not open for evidence",
          400,
          "INVALID_STATUS",
        );
      }

      const currentEvidence = dispute.evidence || [];
      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          evidence: [
            ...currentEvidence,
            {
              submittedBy: req.user!.id,
              content: evidence,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      res.json(updatedDispute);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/resolve",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = resolveDisputeSchema.parse(req.body);

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          task: {
            include: {
              intent: true,
            },
          },
        },
      });

      if (!dispute) {
        throw createError("Dispute not found", 404, "NOT_FOUND");
      }

      if (dispute.status === "RESOLVED") {
        throw createError("Dispute already resolved", 400, "ALREADY_RESOLVED");
      }

      await prisma.$transaction([
        prisma.dispute.update({
          where: { id },
          data: {
            status: "RESOLVED",
            resolution: data.resolution,
            resolvedAt: new Date(),
          },
        }),
        prisma.task.update({
          where: { id: dispute.taskId },
          data: {
            status:
              data.resolution === "requester_refund" ? "FAILED" : "COMPLETED",
            resolution: data.resolution,
            disputeResolvedAt: new Date(),
          },
        }),
        prisma.intent.update({
          where: { id: dispute.task.intentId },
          data: {
            status:
              data.resolution === "requester_refund" ? "DISPUTED" : "COMPLETED",
            completedAt:
              data.resolution === "agent_paid" ? new Date() : undefined,
          },
        }),
      ]);

      const resolutionMessage =
        data.resolution === "requester_refund"
          ? "Funds will be refunded to the requester"
          : "Funds will be released to the agent";

      await prisma.notification.create({
        data: {
          userId: dispute.task.intent.requesterId,
          type: "info",
          title: "Dispute Resolved",
          message: resolutionMessage,
        },
      });

      await prisma.notification.create({
        data: {
          userId: dispute.task.executorId,
          type: "info",
          title: "Dispute Resolved",
          message: resolutionMessage,
        },
      });

      res.json({
        message: "Dispute resolved successfully",
        resolution: data.resolution,
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

router.post(
  "/:id/appeal",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          task: {
            include: {
              intent: true,
            },
          },
        },
      });

      if (!dispute) {
        throw createError("Dispute not found", 404, "NOT_FOUND");
      }

      const isParty =
        dispute.task.intent.requesterId === req.user!.id ||
        dispute.task.executorId === req.user!.id;

      if (!isParty) {
        throw createError("Not authorized to appeal", 403, "FORBIDDEN");
      }

      if (dispute.status !== "RESOLVED") {
        throw createError(
          "Can only appeal resolved disputes",
          400,
          "INVALID_STATUS",
        );
      }

      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          status: "APPEALED",
        },
      });

      await prisma.notification.create({
        data: {
          userId: req.user!.id,
          type: "info",
          title: "Appeal Submitted",
          message: `Your appeal has been submitted for dispute ${id}`,
        },
      });

      res.json({
        message: "Appeal submitted successfully",
        dispute: updatedDispute,
      });
    } catch (error) {
      next(error);
    }
  },
);

export const disputeRouter = router;
