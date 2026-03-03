import { Router, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import type { AuthRequest } from "../types/express.d.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, status, framework, ownerId } = req.query;

      const where: Record<string, unknown> = {};

      if (status) where.status = status;
      if (framework) where.framework = framework;
      if (ownerId) where.ownerId = ownerId;

      const [agents, total] = await Promise.all([
        prisma.agent.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            reputation: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.agent.count({ where }),
      ]);

      res.json({
        agents,
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
  "/templates",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const templates = [
        {
          id: "trading-bot",
          name: "Trading Bot",
          description:
            "Automated DeFi trading bot with arbitrage and yield optimization",
          framework: "elizaos",
          category: "DeFi Trading",
          configSchema: {
            tokens: { type: "array", items: { type: "string" } },
            maxSlippage: { type: "number" },
            strategies: {
              type: "array",
              items: {
                type: "string",
                enum: ["arbitrage", "yield", "liquidity"],
              },
            },
          },
        },
        {
          id: "governance-monitor",
          name: "Governance Monitor",
          description:
            "Monitor DAO proposals and automatically vote based on configured preferences",
          framework: "langchain",
          category: "Governance",
          configSchema: {
            daos: { type: "array", items: { type: "string" } },
            votingStrategy: {
              type: "string",
              enum: ["for", "against", "abstain"],
            },
          },
        },
        {
          id: "data-fetcher",
          name: "Data Fetcher",
          description: "Fetch and aggregate on-chain and off-chain data",
          framework: "langchain",
          category: "Data",
          configSchema: {
            sources: { type: "array", items: { type: "string" } },
            interval: { type: "number" },
          },
        },
        {
          id: "cross-chain-swapper",
          name: "Cross-Chain Swapper",
          description:
            "Execute cross-chain token swaps via intent-based protocols",
          framework: "elizaos",
          category: "DeFi Trading",
          configSchema: {
            sourceChain: { type: "string" },
            destChain: { type: "string" },
            slippageTolerance: { type: "number" },
          },
        },
        {
          id: "nft-flipper",
          name: "NFT Flipper",
          description: "Monitor NFT marketplaces and execute profitable flips",
          framework: "autogen",
          category: "NFT",
          configSchema: {
            marketplaces: { type: "array", items: { type: "string" } },
            maxPrice: { type: "number" },
            targetMargin: { type: "number" },
          },
        },
        {
          id: "price-alert",
          name: "Price Alert",
          description:
            "Monitor token prices and send alerts on price movements",
          framework: "langchain",
          category: "Monitoring",
          configSchema: {
            tokens: { type: "array", items: { type: "string" } },
            priceChangeThreshold: { type: "number" },
            notificationChannels: { type: "array", items: { type: "string" } },
          },
        },
        {
          id: "protocol-health",
          name: "Protocol Health Monitor",
          description:
            "Monitor DeFi protocol health metrics and alert on anomalies",
          framework: "rig",
          category: "Monitoring",
          configSchema: {
            protocols: { type: "array", items: { type: "string" } },
            metrics: { type: "array", items: { type: "string" } },
          },
        },
      ];

      res.json(templates);
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

      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              profile: true,
            },
          },
          reputation: true,
          tasks: {
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              intent: {
                select: {
                  id: true,
                  description: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!agent) {
        throw createError("Agent not found", 404, "AGENT_NOT_FOUND");
      }

      res.json(agent);
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
      const {
        name,
        description,
        framework,
        model,
        config,
        tools,
        codeRepo,
        deploymentType,
        pricingModel,
        price,
      } = req.body;

      const existingAgent = await prisma.agent.findUnique({
        where: {
          ownerId_name: {
            ownerId: req.user!.id,
            name,
          },
        },
      });

      if (existingAgent) {
        throw createError(
          "Agent with this name already exists",
          400,
          "AGENT_EXISTS",
        );
      }

      const agent = await prisma.agent.create({
        data: {
          ownerId: req.user!.id,
          name,
          description,
          framework,
          model,
          config: config || {},
          tools: tools || [],
          codeRepo,
          deploymentType: deploymentType || "CLOUD",
          pricingModel: pricingModel || "fixed",
          price,
          status: "DRAFT",
        },
      });

      await prisma.reputation.create({
        data: {
          agentId: agent.id,
        },
      });

      res.status(201).json(agent);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        framework,
        model,
        config,
        tools,
        codeRepo,
        status,
        deploymentType,
        pricingModel,
        price,
      } = req.body;

      const agent = await prisma.agent.findUnique({ where: { id } });

      if (!agent) {
        throw createError("Agent not found", 404, "AGENT_NOT_FOUND");
      }

      if (
        agent.ownerId !== req.user!.id &&
        !req.user!.roles.includes("ADMIN")
      ) {
        throw createError(
          "Not authorized to update this agent",
          403,
          "FORBIDDEN",
        );
      }

      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(framework && { framework }),
          ...(model !== undefined && { model }),
          ...(config && { config }),
          ...(tools && { tools }),
          ...(codeRepo !== undefined && { codeRepo }),
          ...(status && { status }),
          ...(deploymentType && { deploymentType }),
          ...(pricingModel && { pricingModel }),
          ...(price !== undefined && { price }),
        },
      });

      res.json(updatedAgent);
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

      const agent = await prisma.agent.findUnique({ where: { id } });

      if (!agent) {
        throw createError("Agent not found", 404, "AGENT_NOT_FOUND");
      }

      if (
        agent.ownerId !== req.user!.id &&
        !req.user!.roles.includes("ADMIN")
      ) {
        throw createError(
          "Not authorized to delete this agent",
          403,
          "FORBIDDEN",
        );
      }

      await prisma.agent.delete({ where: { id } });

      res.json({ message: "Agent deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/deploy",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const agent = await prisma.agent.findUnique({ where: { id } });

      if (!agent) {
        throw createError("Agent not found", 404, "AGENT_NOT_FOUND");
      }

      if (agent.ownerId !== req.user!.id) {
        throw createError(
          "Not authorized to deploy this agent",
          403,
          "FORBIDDEN",
        );
      }

      const deploymentUrl = `https://agents.kuberna.africa/${id}`;

      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: {
          status: "DEPLOYED",
          deploymentUrl,
          lastActive: new Date(),
        },
      });

      res.json(updatedAgent);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/start",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const agent = await prisma.agent.findUnique({ where: { id } });

      if (!agent) {
        throw createError("Agent not found", 404, "AGENT_NOT_FOUND");
      }

      if (agent.ownerId !== req.user!.id) {
        throw createError(
          "Not authorized to start this agent",
          403,
          "FORBIDDEN",
        );
      }

      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: {
          status: "RUNNING",
          lastActive: new Date(),
        },
      });

      res.json(updatedAgent);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/stop",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const agent = await prisma.agent.findUnique({ where: { id } });

      if (!agent) {
        throw createError("Agent not found", 404, "AGENT_NOT_FOUND");
      }

      if (agent.ownerId !== req.user!.id) {
        throw createError(
          "Not authorized to stop this agent",
          403,
          "FORBIDDEN",
        );
      }

      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: {
          status: "STOPPED",
        },
      });

      res.json(updatedAgent);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/ping",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const agent = await prisma.agent.findUnique({ where: { id } });

      if (!agent) {
        throw createError("Agent not found", 404, "AGENT_NOT_FOUND");
      }

      await prisma.agent.update({
        where: { id },
        data: {
          lastActive: new Date(),
          status: "RUNNING",
        },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/bids",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const bids = await prisma.bid.findMany({
        where: { agentId: id },
        include: {
          intent: {
            select: {
              id: true,
              description: true,
              status: true,
              budget: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(bids);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/tasks",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const where: Record<string, unknown> = { assignedAgentId: id };
      if (status) where.status = status;

      const tasks = await prisma.task.findMany({
        where,
        include: {
          intent: {
            select: {
              id: true,
              description: true,
              budget: true,
              requesterId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(tasks);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/reputation",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const reputation = await prisma.reputation.findUnique({
        where: { agentId: id },
      });

      if (!reputation) {
        throw createError("Reputation not found", 404, "REPUTATION_NOT_FOUND");
      }

      res.json(reputation);
    } catch (error) {
      next(error);
    }
  },
);

export const agentRouter = router;
