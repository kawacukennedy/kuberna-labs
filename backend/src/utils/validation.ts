import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../middleware/errorHandler.js';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
}

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const intentStatusSchema = z.enum([
  'OPEN',
  'BIDDING',
  'ASSIGNED',
  'EXECUTING',
  'COMPLETED',
  'EXPIRED',
  'DISPUTED',
]);

export const agentStatusSchema = z.enum(['DRAFT', 'DEPLOYED', 'RUNNING', 'STOPPED', 'ERROR']);

export const bidStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);

export const createIntentSchema = z.object({
  description: z.string().min(1).max(1000),
  structuredData: z.record(z.unknown()).optional(),
  sourceChain: z.string().min(1),
  sourceToken: addressSchema,
  sourceAmount: z.string().min(1),
  destChain: z.string().min(1),
  destToken: addressSchema,
  minDestAmount: z.string().min(1),
  deadline: z.string().datetime(),
  budget: z.string().min(1),
  autoAcceptRules: z.record(z.unknown()).optional(),
});

export const createBidSchema = z.object({
  price: z.string().min(1),
  estimatedTime: z.number().int().positive(),
  routeDetails: z.record(z.unknown()).optional(),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  framework: z.string().min(1),
  model: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  tools: z.array(z.string()).optional(),
  codeRepo: z.string().url().optional(),
  deploymentType: z.enum(['CLOUD', 'TEE', 'LOCAL']).default('CLOUD'),
  pricingModel: z.enum(['fixed', 'hourly', 'success']).default('fixed'),
  price: z.number().positive().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  durationHours: z.number().int().positive(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  cryptoPrice: z.record(z.string(), z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
  previewVideoUrl: z.string().url().optional(),
  learningObjectives: z.array(z.string()).min(1),
  prerequisites: z.array(z.string()).default([]),
});

export const updateCourseSchema = createCourseSchema.partial();

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
  fullName: z.string().min(1).max(100),
  web3Address: addressSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema.optional(),
  web3Address: addressSchema.optional(),
  password: z.string().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});
