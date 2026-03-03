import { Router, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import {
  authenticate,
  optionalAuth,
  requireRoles,
} from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        page = 1,
        limit = 12,
        level,
        search,
        sort = "createdAt",
      } = req.query;

      const where: Record<string, unknown> = { published: true };

      if (level) where.level = level;
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
        ];
      }

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            level: true,
            durationHours: true,
            price: true,
            currency: true,
            thumbnailUrl: true,
            learningObjectives: true,
            prerequisites: true,
            instructorId: true,
            createdAt: true,
            instructor: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: { enrollments: true },
            },
          },
          orderBy: { [sort as string]: "desc" },
        }),
        prisma.course.count({ where }),
      ]);

      res.json({
        courses,
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
  "/slug/:slug",
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;

      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          instructor: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              profile: true,
            },
          },
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              contentType: true,
              estimatedMinutes: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
      });

      if (!course) {
        throw createError("Course not found", 404, "COURSE_NOT_FOUND");
      }

      res.json(course);
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

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          instructor: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              profile: true,
            },
          },
          modules: {
            orderBy: { order: "asc" },
          },
          workshops: {
            where: {
              scheduledAt: { gte: new Date() },
            },
            orderBy: { scheduledAt: "asc" },
            take: 5,
          },
          forumTopics: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              views: true,
              userId: true,
              createdAt: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
      });

      if (!course) {
        throw createError("Course not found", 404, "COURSE_NOT_FOUND");
      }

      let enrollment = null;
      if (req.user) {
        enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: req.user.id,
              courseId: id,
            },
          },
        });
      }

      res.json({ ...course, enrollment });
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
        level,
        durationHours,
        price,
        currency,
        thumbnailUrl,
        previewVideoUrl,
        learningObjectives,
        prerequisites,
      } = req.body;

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingCourse = await prisma.course.findUnique({
        where: { slug },
      });
      if (existingCourse) {
        throw createError(
          "Course with similar title already exists",
          400,
          "COURSE_EXISTS",
        );
      }

      const course = await prisma.course.create({
        data: {
          title,
          slug,
          description,
          level,
          durationHours,
          price: price || 0,
          currency: currency || "USD",
          thumbnailUrl,
          previewVideoUrl,
          learningObjectives: learningObjectives || [],
          prerequisites: prerequisites || [],
          instructorId: req.user!.id,
        },
      });

      res.status(201).json(course);
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
        level,
        durationHours,
        price,
        thumbnailUrl,
        previewVideoUrl,
        learningObjectives,
        prerequisites,
        published,
      } = req.body;

      const course = await prisma.course.findUnique({ where: { id } });

      if (!course) {
        throw createError("Course not found", 404, "COURSE_NOT_FOUND");
      }

      if (
        course.instructorId !== req.user!.id &&
        !req.user!.roles.includes("ADMIN")
      ) {
        throw createError(
          "Not authorized to update this course",
          403,
          "FORBIDDEN",
        );
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(level && { level }),
          ...(durationHours && { durationHours }),
          ...(price !== undefined && { price }),
          ...(thumbnailUrl !== undefined && { thumbnailUrl }),
          ...(previewVideoUrl !== undefined && { previewVideoUrl }),
          ...(learningObjectives && { learningObjectives }),
          ...(prerequisites && { prerequisites }),
          ...(published !== undefined && {
            published,
            publishedAt: published ? new Date() : null,
          }),
        },
      });

      res.json(updatedCourse);
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

      await prisma.course.delete({ where: { id } });

      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/enroll",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { paymentTxHash } = req.body;

      const course = await prisma.course.findUnique({ where: { id } });

      if (!course) {
        throw createError("Course not found", 404, "COURSE_NOT_FOUND");
      }

      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: id,
          },
        },
      });

      if (existingEnrollment) {
        throw createError(
          "Already enrolled in this course",
          400,
          "ALREADY_ENROLLED",
        );
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: req.user!.id,
          courseId: id,
          paymentTxHash,
        },
      });

      res.status(201).json(enrollment);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/modules",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: id,
          },
        },
      });

      if (!enrollment) {
        throw createError("Not enrolled in this course", 403, "NOT_ENROLLED");
      }

      const modules = await prisma.module.findMany({
        where: { courseId: id },
        orderBy: { order: "asc" },
      });

      res.json(modules);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/modules/:moduleId",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, moduleId } = req.params;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: id,
          },
        },
      });

      if (!enrollment) {
        throw createError("Not enrolled in this course", 403, "NOT_ENROLLED");
      }

      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module || module.courseId !== id) {
        throw createError("Module not found", 404, "MODULE_NOT_FOUND");
      }

      res.json(module);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/modules/:moduleId/complete",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, moduleId } = req.params;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId: id,
          },
        },
        include: {
          course: {
            include: {
              modules: true,
            },
          },
        },
      });

      if (!enrollment) {
        throw createError("Not enrolled in this course", 403, "NOT_ENROLLED");
      }

      const completedModules = enrollment.completedModules || [];
      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId);
      }

      const progressPercent = Math.round(
        (completedModules.length / enrollment.course.modules.length) * 100,
      );

      const isCompleted = progressPercent === 100;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          completedModules,
          progressPercent,
          completedAt: isCompleted ? new Date() : null,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
        },
      });

      if (isCompleted) {
        const certificate = await prisma.certificate.create({
          data: {
            userId: req.user!.id,
            courseId: id,
            tokenId: BigInt(Date.now()),
          },
        });

        res.json({
          progressPercent,
          completed: true,
          certificateId: certificate.id,
        });
      } else {
        res.json({ progressPercent, completed: false });
      }
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/modules",
  authenticate,
  requireRoles("ADMIN", "INSTRUCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        title,
        order,
        contentType,
        contentUrl,
        videoDuration,
        documentText,
        labConfig,
        quizQuestions,
        estimatedMinutes,
      } = req.body;

      const course = await prisma.course.findUnique({ where: { id } });

      if (!course) {
        throw createError("Course not found", 404, "COURSE_NOT_FOUND");
      }

      if (
        course.instructorId !== req.user!.id &&
        !req.user!.roles.includes("ADMIN")
      ) {
        throw createError(
          "Not authorized to add modules to this course",
          403,
          "FORBIDDEN",
        );
      }

      const maxOrder = await prisma.module.aggregate({
        where: { courseId: id },
        _max: { order: true },
      });

      const module = await prisma.module.create({
        data: {
          courseId: id,
          title,
          order: order || (maxOrder._max.order || 0) + 1,
          contentType,
          contentUrl,
          videoDuration,
          documentText,
          labConfig,
          quizQuestions,
          estimatedMinutes: estimatedMinutes || 30,
        },
      });

      res.status(201).json(module);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/modules/:moduleId",
  authenticate,
  requireRoles("ADMIN", "INSTRUCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const {
        title,
        order,
        contentType,
        contentUrl,
        videoDuration,
        documentText,
        labConfig,
        quizQuestions,
        estimatedMinutes,
      } = req.body;

      const module = await prisma.module.update({
        where: { id: moduleId },
        data: {
          ...(title && { title }),
          ...(order && { order }),
          ...(contentType && { contentType }),
          ...(contentUrl !== undefined && { contentUrl }),
          ...(videoDuration !== undefined && { videoDuration }),
          ...(documentText !== undefined && { documentText }),
          ...(labConfig !== undefined && { labConfig }),
          ...(quizQuestions !== undefined && { quizQuestions }),
          ...(estimatedMinutes && { estimatedMinutes }),
        },
      });

      res.json(module);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id/modules/:moduleId",
  authenticate,
  requireRoles("ADMIN", "INSTRUCTOR"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;

      await prisma.module.delete({ where: { id: moduleId } });

      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

export const courseRouter = router;
