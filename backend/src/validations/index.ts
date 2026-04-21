import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  web3Address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  website: z.string().url().optional().nullable(),
  github: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  discord: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  durationHours: z.number().int().positive(),
  price: z.number().nonnegative(),
  currency: z.string().default('USD'),
  cryptoPrice: z.record(z.string(), z.number()).optional(),
  thumbnailUrl: z.string().url().optional(),
  previewVideoUrl: z.string().url().optional().nullable(),
  learningObjectives: z.array(z.string()).min(1),
  prerequisites: z.array(z.string()).default([]),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  published: z.boolean().optional(),
  coInstructorIds: z.array(z.string()).optional(),
});

export const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.number().int().positive(),
  contentType: z.enum(['VIDEO', 'DOCUMENT', 'LAB', 'QUIZ']),
  contentUrl: z.string().url().optional().nullable(),
  videoDuration: z.number().int().optional(),
  documentText: z.string().optional().nullable(),
  labConfig: z.object({
    dockerImage: z.string().optional(),
    starterCode: z.record(z.unknown()).optional(),
    testCommand: z.string().optional(),
    expectedOutput: z.string().optional(),
    timeoutSeconds: z.number().optional(),
  }).optional(),
  quizQuestions: z.object({
    questions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string().optional(),
    })),
  }).optional(),
  estimatedMinutes: z.number().int().positive(),
  isFree: z.boolean().optional().default(false),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  framework: z.enum(['ELIZAOS', 'LANGCHAIN', 'AUTOGEN', 'RIG']),
  model: z.string().min(1).max(100),
  config: z.record(z.unknown()).default({}),
  tools: z.array(z.string()).default([]),
  pricingModel: z.enum(['FIXED', 'HOURLY', 'SUCCESS']).default('FIXED'),
  price: z.number().optional(),
  supportedChains: z.array(z.string()).default(['ethereum']),
  ipWhitelist: z.array(z.string()).default([]),
});

export const updateAgentSchema = createAgentSchema.partial().extend({
  status: z.enum(['DRAFT', 'DEPLOYED', 'RUNNING', 'STOPPED', 'ERROR']).optional(),
  config: z.record(z.unknown()).optional(),
  tools: z.array(z.string()).optional(),
});

export const createIntentSchema = z.object({
  description: z.string().min(10).max(5000),
  structuredData: z.record(z.unknown()).optional(),
  sourceChain: z.string().min(1),
  sourceToken: z.string().min(1),
  sourceAmount: z.string().regex(/^\d+$/),
  destChain: z.string().min(1),
  destToken: z.string().min(1),
  minDestAmount: z.string().regex(/^\d+$/),
  deadline: z.string().datetime(),
  budget: z.string().regex(/^\d+$/),
  currency: z.string().default('NEAR'),
  autoAcceptRules: z.object({
    minReputation: z.number().optional(),
    maxPrice: z.string().optional(),
    maxTime: z.number().optional(),
  }).optional(),
});

export const createBidSchema = z.object({
  price: z.string().regex(/^\d+$/),
  estimatedTime: z.number().int().positive(),
  routeDetails: z.record(z.unknown()).optional(),
});

export const completeTaskSchema = z.object({
  result: z.record(z.unknown()),
  proof: z.record(z.unknown()).optional(),
});

export const disputeTaskSchema = z.object({
  reason: z.string().min(10).max(2000),
});

export const createEnrollmentSchema = z.object({
  courseId: z.string().uuid(),
  paymentToken: z.string().optional(),
  paymentMethod: z.enum(['crypto', 'fiat']).default('crypto'),
});

export const createForumTopicSchema = z.object({
  courseId: z.string().uuid().optional(),
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(10000),
});

export const createForumPostSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

export const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  category: z.string().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  assignedTo: z.string().uuid().optional(),
  resolution: z.string().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).min(1),
  expiresAt: z.string().datetime().optional(),
});

export const createWorkshopSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().max(480),
  maxParticipants: z.number().int().positive().max(1000),
});

export const updateWorkshopSchema = createWorkshopSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  recordingUrl: z.string().url().optional().nullable(),
});

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  active: z.boolean().default(true),
});

export const updateSubscriptionSchema = z.object({
  tier: z.enum(['SDK', 'ACCELERATOR', 'ENTERPRISE', 'ENTERPRISE_PLUS']),
  autoRenew: z.boolean(),
});

export const ipWhitelistSchema = z.object({
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/),
  description: z.string().max(200).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type CreateIntentInput = z.infer<typeof createIntentSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type DisputeTaskInput = z.infer<typeof disputeTaskSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type CreateForumTopicInput = z.infer<typeof createForumTopicSchema>;
export type CreateForumPostInput = z.infer<typeof createForumPostSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type IPWhitelistInput = z.infer<typeof ipWhitelistSchema>;