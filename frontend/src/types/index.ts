import { Address, Hash } from 'viem';

export type ChainId = 1 | 11155111 | 137 | 80002 | 42161 | 421614;

export type Role = 'admin' | 'instructor' | 'learner' | 'requester' | 'solver';

export type AuthMethod = 'email' | 'web3' | 'oauth';

export interface User {
  id: string;
  email?: string;
  web3Address?: Address;
  authMethod: AuthMethod;
  fullName: string;
  avatarUrl?: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  website?: string;
  github?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  linkedin?: string;
  skills: string[];
  reputationScore: number;
  totalTasksCompleted: number;
  totalEarned: string;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'video' | 'document' | 'lab' | 'quiz';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: CourseLevel;
  durationHours: number;
  price: number;
  currency: string;
  cryptoPrice?: Record<string, string>;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  learningObjectives: string[];
  prerequisites: string[];
  instructorId: string;
  coInstructors: string[];
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  contentType: ContentType;
  contentUrl?: string;
  videoDuration?: number;
  documentText?: string;
  labConfig?: LabConfig;
  quizQuestions?: QuizQuestion[];
  estimatedMinutes: number;
}

export interface LabConfig {
  dockerImage: string;
  starterCode: Record<string, string>;
  testCommand: string;
  expectedOutput: string;
  timeoutSeconds: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'expired';
  progressPercent: number;
  completedModules: string[];
  certificateId?: string;
  certificateIpfsHash?: string;
  enrolledAt: Date;
  completedAt?: Date;
}

export type AgentFramework = 'elizaos' | 'langchain' | 'autogen' | 'rig';
export type DeploymentType = 'cloud' | 'tee' | 'local';
export type AgentStatus = 'draft' | 'deployed' | 'running' | 'stopped' | 'error';
export type PricingModel = 'fixed' | 'hourly' | 'success';

export interface Agent {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  framework: AgentFramework;
  model: string;
  codeRepo?: string;
  config: Record<string, unknown>;
  tools: string[];
  status: AgentStatus;
  deploymentType: DeploymentType;
  deploymentUrl?: string;
  teeAttestation?: TeeAttestation;
  lastPing?: Date;
  version: number;
  lastActive?: Date;
  pricingModel: PricingModel;
  price?: string;
}

export interface TeeAttestation {
  provider: string;
  report: string;
  verified: boolean;
  timestamp: bigint;
}

export type IntentStatus = 
  | 'open' 
  | 'bidding' 
  | 'assigned' 
  | 'executing' 
  | 'completed' 
  | 'expired' 
  | 'disputed';

export interface Intent {
  id: string;
  requesterId: string;
  description: string;
  structured: Record<string, unknown>;
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destinationChain: string;
  destinationToken: string;
  minDestinationAmount: string;
  timeoutSeconds: number;
  budget: string;
  currency: string;
  status: IntentStatus;
  selectedSolverId?: string;
  escrowId?: string;
  autoAcceptRules?: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}

export type BidStatus = 'pending' | 'accepted' | 'rejected';

export interface Bid {
  id: string;
  intentId: string;
  agentId: string;
  price: string;
  estimatedTime: number;
  routeDetails?: Record<string, unknown>;
  status: BidStatus;
  createdAt: Date;
}

export type TaskStatus = 'assigned' | 'executing' | 'completed' | 'failed' | 'disputed';

export interface Task {
  id: string;
  intentId: string;
  assignedAgentId: string;
  status: TaskStatus;
  result?: Record<string, unknown>;
  proof?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  transactionHash?: Hash;
  disputeReason?: string;
  disputeResolvedAt?: Date;
  resolution?: 'requester_refund' | 'agent_paid';
}

export interface Escrow {
  id: string;
  intentId: string;
  requesterId: string;
  executorId?: string;
  token: Address;
  amount: bigint;
  fee: bigint;
  deadline: Date;
  status: EscrowStatus;
}

export type EscrowStatus = 
  | 'none' 
  | 'funded' 
  | 'assigned' 
  | 'completed' 
  | 'disputed' 
  | 'released' 
  | 'refunded' 
  | 'expired';

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  permissions: string[];
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Workshop {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructorId: string;
  scheduledAt: Date;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  recordingUrl?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface ForumPost {
  id: string;
  topicId: string;
  userId: string;
  content: string;
  upvotes: number;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dispute {
  id: string;
  taskId: string;
  raisedBy: string;
  reason: string;
  evidence: string[];
  status: 'open' | 'voting' | 'resolved';
  resolution?: 'requester_refund' | 'agent_paid';
  resolvedAt?: Date;
}
