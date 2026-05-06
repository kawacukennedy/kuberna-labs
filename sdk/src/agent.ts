import { KubernaSDK } from './index.js';
import { z } from 'zod';

export const frameworkSchema = z.enum(['ElizaOS', 'LangChain', 'AutoGen', 'Rig']);

export interface CreateAgentParams {
  name: string;
  description?: string;
  framework: 'ElizaOS' | 'LangChain' | 'AutoGen' | 'Rig';
  model?: string;
  config?: Record<string, unknown>;
  tools?: string[];
  codeRepo?: string;
  deploymentType?: 'CLOUD' | 'TEE' | 'LOCAL';
}

export interface Agent {
  id: string;
  name: string;
  status: string;
  deploymentUrl?: string;
}

export class AgentManager {
  constructor(private sdk: KubernaSDK) {}

  async create(params: CreateAgentParams): Promise<Agent> {
    frameworkSchema.parse(params.framework); // Validate
    const response = await this.sdk.request('POST', '/agents', params);
    return response;
  }

  async get(id: string): Promise<Agent> {
    return this.sdk.request('GET', `/agents/${id}`);
  }

  async list(ownerId?: string): Promise<Agent[]> {
    const response = await this.sdk.request('GET', '/agents', ownerId ? { ownerId } : undefined);
    return response.agents;
  }

  async deploy(id: string, params: { secureExecution?: string } = {}): Promise<Agent> {
    const endpoint = params.secureExecution === 'TEE' ? `/agents/${id}/deploy-tee` : `/agents/${id}/deploy`;
    return this.sdk.request('POST', endpoint, {});
  }

  async start(id: string): Promise<Agent> {
    return this.sdk.request('POST', `/agents/${id}/start`, {});
  }

  async stop(id: string): Promise<Agent> {
    return this.sdk.request('POST', `/agents/${id}/stop`, {});
  }
}
