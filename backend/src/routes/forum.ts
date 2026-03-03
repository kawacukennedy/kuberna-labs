import { Router, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/topics",
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, courseId } = req.query;
      const where: Record<string, unknown> = {};
      if (courseId) where.courseId = courseId;

      const [topics, total] = await Promise.all([
        prisma.forumTopic.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
            course: { select: { id: true, title: true } },
            _count: { select: { posts: true } },
          },
          orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        }),
        prisma.forumTopic.count({ where }),
      ]);

      res.json({
        topics,
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
  "/topics/:id",
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const topic = await prisma.forumTopic.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
          course: true,
          posts: {
            include: {
              user: { select: { id: true, fullName: true, avatarUrl: true } },
            },
            orderBy: [{ isAnswer: "desc" }, { createdAt: "asc" }],
          },
          _count: { select: { posts: true } },
        },
      });
      if (!topic) throw createError("Topic not found", 404, "NOT_FOUND");

      await prisma.forumTopic.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      res.json(topic);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/topics",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, content, courseId } = req.body;
      const topic = await prisma.forumTopic.create({
        data: { title, content, courseId, userId: req.user!.id },
      });
      res.status(201).json(topic);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/topics/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, content, pinned, locked } = req.body;
      const topic = await prisma.forumTopic.findUnique({ where: { id } });
      if (!topic) throw createError("Topic not found", 404, "NOT_FOUND");
      if (topic.userId !== req.user!.id && !req.user!.roles.includes("ADMIN")) {
        throw createError("Not authorized", 403, "FORBIDDEN");
      }
      const updated = await prisma.forumTopic.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(pinned !== undefined && { pinned }),
          ...(locked !== undefined && { locked }),
        },
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/topics/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const topic = await prisma.forumTopic.findUnique({ where: { id } });
      if (!topic) throw createError("Topic not found", 404, "NOT_FOUND");
      if (topic.userId !== req.user!.id && !req.user!.roles.includes("ADMIN")) {
        throw createError("Not authorized", 403, "FORBIDDEN");
      }
      await prisma.forumTopic.delete({ where: { id } });
      res.json({ message: "Topic deleted" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/topics/:id/posts",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const topic = await prisma.forumTopic.findUnique({ where: { id } });
      if (!topic) throw createError("Topic not found", 404, "NOT_FOUND");
      if (topic.locked) throw createError("Topic is locked", 400, "LOCKED");

      const post = await prisma.forumPost.create({
        data: { topicId: id, content, userId: req.user!.id },
      });
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/posts/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { content, isAnswer } = req.body;
      const post = await prisma.forumPost.findUnique({ where: { id } });
      if (!post) throw createError("Post not found", 404, "NOT_FOUND");

      const topic = await prisma.forumTopic.findUnique({
        where: { id: post.topicId },
      });
      if (
        post.userId !== req.user!.id &&
        (!topic || topic.userId !== req.user!.id) &&
        !req.user!.roles.includes("ADMIN")
      ) {
        throw createError("Not authorized", 403, "FORBIDDEN");
      }

      const updated = await prisma.forumPost.update({
        where: { id },
        data: {
          ...(content && { content }),
          ...(isAnswer !== undefined && { isAnswer }),
        },
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/posts/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const post = await prisma.forumPost.findUnique({ where: { id } });
      if (!post) throw createError("Post not found", 404, "NOT_FOUND");

      const topic = await prisma.forumTopic.findUnique({
        where: { id: post.topicId },
      });
      if (
        post.userId !== req.user!.id &&
        (!topic || topic.userId !== req.user!.id) &&
        !req.user!.roles.includes("ADMIN")
      ) {
        throw createError("Not authorized", 403, "FORBIDDEN");
      }

      await prisma.forumPost.delete({ where: { id } });
      res.json({ message: "Post deleted" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/posts/:id/upvote",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await prisma.forumPost.update({
        where: { id },
        data: { upvotes: { increment: 1 } },
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

export const forumRouter = router;
