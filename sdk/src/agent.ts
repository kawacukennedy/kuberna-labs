import { KubernaSDK } from "./index.js";

export interface CreateAgentParams {
  name: string;
  description?: string;
  framework: "ElizaOS" | "LangChain" | "AutoGen" | "Rig";
  model?: string;
  config?: Record<string, any>;
  tools?: string[];
  deploymentType?: "CLOUD" | "TEE" | "LOCAL";
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
    const response = await this.sdk.request("POST", "/agents", params);
    return response;
  }

  async get(id: string): Promise<Agent> {
    return this.sdk.request("GET", `/agents/${id}`);
  }

  async list(): Promise<Agent[]> {
    const response = await this.sdk.request("GET", "/agents");
    return response.agents;
  }

  async deploy(id: string, params: { secureExecution?: string } = {}): Promise<Agent> {
    const endpoint = params.secureExecution === "TEE" ? `/agents/${id}/deploy-tee` : `/agents/${id}/deploy`;
    return this.sdk.request("POST", endpoint, {});
  }

  async start(id: string): Promise<Agent> {
    return this.sdk.request("POST", `/agents/${id}/start`, {});
  }

  async stop(id: string): Promise<Agent> {
    return this.sdk.request("POST", `/agents/${id}/stop`, {});
  }
}
