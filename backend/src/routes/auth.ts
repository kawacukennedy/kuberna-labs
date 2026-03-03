import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  web3Address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post(
  "/register",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            ...(data.web3Address ? [{ web3Address: data.web3Address }] : []),
          ],
        },
      });

      if (existingUser) {
        throw createError(
          "Email or wallet already registered",
          400,
          "USER_EXISTS",
        );
      }

      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          web3Address: data.web3Address,
          authMethod: data.web3Address ? "WEB3" : "EMAIL",
          profile: {
            create: {},
          },
        },
        include: {
          profile: true,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, roles: user.roles },
        process.env.JWT_SECRET || "kuberna-secret-key",
        { expiresIn: "7d" },
      );

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles,
          avatarUrl: user.avatarUrl,
        },
        token,
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
  "/login",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user || !user.passwordHash) {
        throw createError("Invalid credentials", 401, "INVALID_CREDENTIALS");
      }

      const validPassword = await bcrypt.compare(
        data.password,
        user.passwordHash,
      );
      if (!validPassword) {
        throw createError("Invalid credentials", 401, "INVALID_CREDENTIALS");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          loginCount: { increment: 1 },
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, roles: user.roles },
        process.env.JWT_SECRET || "kuberna-secret-key",
        { expiresIn: "7d" },
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles,
          avatarUrl: user.avatarUrl,
        },
        token,
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
  "/logout",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.json({ message: "Logged out successfully" });
  },
);

router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          profile: true,
          _count: {
            select: {
              agents: true,
              enrollments: true,
              intents: true,
            },
          },
        },
      });

      if (!user) {
        throw createError("User not found", 404, "USER_NOT_FOUND");
      }

      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
        avatarUrl: user.avatarUrl,
        web3Address: user.web3Address,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        profile: user.profile,
        stats: {
          agentsCount: user._count.agents,
          coursesEnrolled: user._count.enrollments,
          intentsPosted: user._count.intents,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/forgot-password",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.json({ message: "If account exists, reset email will be sent" });
        return;
      }

      const resetToken = jwt.sign(
        { id: user.id, type: "password-reset" },
        process.env.JWT_SECRET || "kuberna-secret-key",
        { expiresIn: "1h" },
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000),
        },
      });

      res.json({ message: "If account exists, reset email will be sent" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/reset-password",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "kuberna-secret-key",
      ) as { id: string };

      const user = await prisma.user.findFirst({
        where: {
          id: decoded.id,
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw createError("Invalid or expired token", 400, "INVALID_TOKEN");
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(createError("Invalid or expired token", 400, "INVALID_TOKEN"));
      } else {
        next(error);
      }
    }
  },
);

router.post(
  "/web3-login",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { web3Address, signature, message } = req.body;

      const user = await prisma.user.findUnique({
        where: { web3Address },
      });

      if (!user) {
        throw createError(
          "No account found for this wallet",
          404,
          "USER_NOT_FOUND",
        );
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, roles: user.roles },
        process.env.JWT_SECRET || "kuberna-secret-key",
        { expiresIn: "7d" },
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles,
          avatarUrl: user.avatarUrl,
          web3Address: user.web3Address,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/web3-register",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { web3Address, fullName } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { web3Address },
      });

      if (existingUser) {
        throw createError("Wallet already registered", 400, "WALLET_EXISTS");
      }

      const user = await prisma.user.create({
        data: {
          email: `${web3Address.toLowerCase()}@wallet.kuberna.africa`,
          fullName: fullName || "Wallet User",
          web3Address: web3Address.toLowerCase(),
          authMethod: "WEB3",
          profile: {
            create: {},
          },
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, roles: user.roles },
        process.env.JWT_SECRET || "kuberna-secret-key",
        { expiresIn: "7d" },
      );

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles,
          web3Address: user.web3Address,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

export const authRouter = router;
