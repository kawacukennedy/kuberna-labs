import { KubernaSDK } from './index.js';
import { z } from 'zod';

export const frameworkSchema = z.enum(['ElizaOS', 'LangChain', 'AutoGen', 'Rig']);

/**
 * Parameters for creating a new autonomous AI agent.
 */
export interface CreateAgentParams {
  /** The display name of the agent. */
  name: string;
  /** Detailed description of the agent's responsibilities. */
  description?: string;
  /** The agentic framework orchestrating the agent. */
  framework: 'ElizaOS' | 'LangChain' | 'AutoGen' | 'Rig';
  /** Foundation LLM model identifier. */
  model?: string;
  /** Framework-specific configuration dictionary. */
  config?: Record<string, unknown>;
  /** External tool and skill identifiers registered to the agent. */
  tools?: string[];
  /** Git repository URI containing custom agent logic. */
  codeRepo?: string;
  /** Execution environment (CLOUD, TEE, or LOCAL). */
  deploymentType?: 'CLOUD' | 'TEE' | 'LOCAL';
}

/**
 * Represents a registered agent instance in Kuberna Labs.
 */
export interface Agent {
  /** Unique agent identifier. */
  id: string;
  /** Name of the agent. */
  name: string;
  /** Current operational lifecycle status (e.g., ACTIVE, STOPPED). */
  status: string;
  /** Deployed service URL if active. */
  deploymentUrl?: string;
}

/**
 * Manager class for registering, deploying, and controlling autonomous agents.
 */
export class AgentManager {
  /**
   * Initializes the AgentManager with a KubernaSDK client instance.
   * @param sdk - The root KubernaSDK instance.
   */
  constructor(private sdk: KubernaSDK) {}

  /**
   * Creates a new AI agent with the specified configuration.
   * @param params - Agent creation parameters including name, framework, and deployment type.
   * @returns The created agent record with its assigned ID.
   * @throws {ZodError} If the specified framework is invalid.
   */
  async create(params: CreateAgentParams): Promise<Agent> {
    frameworkSchema.parse(params.framework);
    const response = await this.sdk.request({ method: 'POST', path: '/agents', data: params as unknown as Record<string, unknown> });
    return response.data as Agent;
  }

  /**
   * Retrieves an agent record by its unique identifier.
   * @param id - Unique agent identifier.
   * @returns The agent details.
   */
  async get(id: string): Promise<Agent> {
    const response = await this.sdk.request({ method: 'GET', path: `/agents/${id}` });
    return response.data as Agent;
  }

  /**
   * Lists all agents, optionally filtered by owner identifier.
   * @param ownerId - Optional owner ID filter.
   * @returns Array of agent instances.
   */
  async list(ownerId?: string): Promise<Agent[]> {
    const response = await this.sdk.request({ method: 'GET', path: '/agents', data: ownerId ? { ownerId } : undefined });
    return (response.data as { agents: Agent[] }).agents;
  }

  /**
   * Deploys an agent to Cloud or Trusted Execution Environment (TEE).
   * @param id - Unique agent identifier.
   * @param params - Deployment parameters, e.g. setting secureExecution to 'TEE'.
   * @returns Updated agent record with deployment URL.
   */
  async deploy(id: string, params: { secureExecution?: string } = {}): Promise<Agent> {
    const endpoint = params.secureExecution === 'TEE' ? `/agents/${id}/deploy-tee` : `/agents/${id}/deploy`;
    const response = await this.sdk.request({ method: 'POST', path: endpoint, data: {} });
    return response.data as Agent;
  }

  /**
   * Starts a deployed agent runtime.
   * @param id - Unique agent identifier.
   * @returns Updated agent status.
   */
  async start(id: string): Promise<Agent> {
    const response = await this.sdk.request({ method: 'POST', path: `/agents/${id}/start`, data: {} });
    return response.data as Agent;
  }

  /**
   * Stops a running agent instance.
   * @param id - Unique agent identifier.
   * @returns Updated agent status.
   */
  async stop(id: string): Promise<Agent> {
    const response = await this.sdk.request({ method: 'POST', path: `/agents/${id}/stop`, data: {} });
    return response.data as Agent;
  }
}
