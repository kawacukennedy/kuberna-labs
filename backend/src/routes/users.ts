import { Router, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, role, search } = req.query;

      const where: Record<string, unknown> = {};

      if (role) {
        where.roles = { has: role as string };
      }

      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: "insensitive" } },
          { fullName: { contains: search as string, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            roles: true,
            createdAt: true,
            lastLogin: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        users,
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

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          agents: {
            select: {
              id: true,
              name: true,
              status: true,
              framework: true,
              lastActive: true,
            },
          },
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              agents: true,
              intents: true,
              tasksAssigned: true,
            },
          },
        },
      });

      if (!user) {
        throw createError("User not found", 404, "USER_NOT_FOUND");
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  requireRoles("ADMIN"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { roles, fullName, avatarUrl } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(roles && { roles }),
          ...(fullName && { fullName }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          roles: true,
          avatarUrl: true,
        },
      });

      res.json(user);
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

      await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/profile",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const profile = await prisma.profile.findUnique({
        where: { userId: id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
      });

      if (!profile) {
        throw createError("Profile not found", 404, "PROFILE_NOT_FOUND");
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/profile",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (req.user!.id !== id) {
        throw createError(
          "Not authorized to update this profile",
          403,
          "FORBIDDEN",
        );
      }

      const {
        bio,
        website,
        github,
        twitter,
        discord,
        telegram,
        linkedin,
        skills,
      } = req.body;

      const profile = await prisma.profile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          bio,
          website,
          github,
          twitter,
          discord,
          telegram,
          linkedin,
          skills: skills || [],
        },
        update: {
          ...(bio !== undefined && { bio }),
          ...(website !== undefined && { website }),
          ...(github !== undefined && { github }),
          ...(twitter !== undefined && { twitter }),
          ...(discord !== undefined && { discord }),
          ...(telegram !== undefined && { telegram }),
          ...(linkedin !== undefined && { linkedin }),
          ...(skills && { skills }),
        },
      });

      res.json(profile);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/agents",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, framework } = req.query;

      const where: Record<string, unknown> = { ownerId: id };

      if (status) where.status = status;
      if (framework) where.framework = framework;

      const agents = await prisma.agent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          reputation: true,
        },
      });

      res.json(agents);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/enrollments",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const enrollments = await prisma.enrollment.findMany({
        where: { userId: id },
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      });

      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  },
);

export const userRouter = router;
