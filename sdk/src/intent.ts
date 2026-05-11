import { KubernaSDK } from "./index.js";

export interface CreateIntentParams {
  task: string;
  budget?: string;
  deadline?: number;
  secureExecution?: "TEE" | "NONE";
}

export interface Intent {
  id: string;
  status: string;
  description: string;
}

export class IntentManager {
  constructor(private sdk: KubernaSDK) {}

  async create(params: CreateIntentParams): Promise<Intent> {
    const response = await this.sdk.request({
      method: "POST",
      path: "/intents",
      data: {
        description: params.task,
        budget: params.budget,
        deadline: params.deadline,
        secureExecution: params.secureExecution,
      } as Record<string, unknown>,
    });
    return response.data as Intent;
  }

  async get(id: string): Promise<Intent> {
    const response = await this.sdk.request({ method: "GET", path: `/intents/${id}` });
    return response.data as Intent;
  }

  async list(): Promise<Intent[]> {
    const response = await this.sdk.request({ method: "GET", path: "/intents" });
    return (response.data as { intents: Intent[] }).intents;
  }

  async cancel(id: string): Promise<void> {
    await this.sdk.request({ method: "POST", path: `/intents/${id}/cancel`, data: {} });
  }
}
