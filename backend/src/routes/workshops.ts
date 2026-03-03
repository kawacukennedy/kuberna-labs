import { Router, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import {
  authenticate,
  requireRoles,
  optionalAuth,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, courseId } = req.query;

      const where: Record<string, unknown> = {};
      if (courseId) where.courseId = courseId;

      const [workshops, total] = await Promise.all([
        prisma.workshop.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            course: {
              select: { id: true, title: true, thumbnailUrl: true },
            },
            registrations: true,
            _count: { select: { registrations: true } },
          },
          orderBy: { scheduledAt: "asc" },
        }),
        prisma.workshop.count({ where }),
      ]);

      res.json({
        workshops,
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
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const workshop = await prisma.workshop.findUnique({
        where: { id },
        include: {
          course: true,
          registrations: {
            include: {
              user: { select: { id: true, fullName: true, avatarUrl: true } },
            },
          },
        },
      });

      if (!workshop) throw createError("Workshop not found", 404, "NOT_FOUND");

      let registration = null;
      if (req.user) {
        registration =
          workshop.registrations.find((r) => r.userId === req.user!.id) || null;
      }

      res.json({ ...workshop, registration });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/",
  authenticate,
  requireRoles("ADMIN", "INSTRUCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        description,
        courseId,
        scheduledAt,
        duration,
        maxParticipants,
      } = req.body;

      const workshop = await prisma.workshop.create({
        data: {
          title,
          description,
          courseId,
          instructorId: req.user!.id,
          scheduledAt: new Date(scheduledAt),
          duration,
          maxParticipants,
        },
      });

      res.status(201).json(workshop);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  requireRoles("ADMIN", "INSTRUCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        scheduledAt,
        duration,
        maxParticipants,
        status,
        recordingUrl,
      } = req.body;

      const workshop = await prisma.workshop.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
          ...(duration && { duration }),
          ...(maxParticipants && { maxParticipants }),
          ...(status && { status }),
          ...(recordingUrl !== undefined && { recordingUrl }),
        },
      });

      res.json(workshop);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.workshop.delete({ where: { id } });
      res.json({ message: "Workshop deleted" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/register",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const workshop = await prisma.workshop.findUnique({
        where: { id },
        include: { _count: { select: { registrations: true } } },
      });

      if (!workshop) throw createError("Workshop not found", 404, "NOT_FOUND");
      if (workshop._count.registrations >= workshop.maxParticipants) {
        throw createError("Workshop is full", 400, "FULL");
      }

      const registration = await prisma.workshopRegistration.upsert({
        where: { workshopId_userId: { workshopId: id, userId: req.user!.id } },
        create: { workshopId: id, userId: req.user!.id },
        update: {},
      });

      await prisma.workshop.update({
        where: { id },
        data: { currentParticipants: { increment: 1 } },
      });

      res.status(201).json(registration);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id/register",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.workshopRegistration.deleteMany({
        where: { workshopId: id, userId: req.user!.id },
      });

      await prisma.workshop.update({
        where: { id },
        data: { currentParticipants: { decrement: 1 } },
      });

      res.json({ message: "Registration cancelled" });
    } catch (error) {
      next(error);
    }
  },
);

export const workshopRouter = router;
