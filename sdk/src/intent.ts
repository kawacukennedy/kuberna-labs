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
    const response = await this.sdk.request("POST", "/intents", {
      description: params.task,
      budget: params.budget,
      deadline: params.deadline,
      secureExecution: params.secureExecution,
    });
    return response;
  }

  async get(id: string): Promise<Intent> {
    return this.sdk.request("GET", `/intents/${id}`);
  }

  async list(): Promise<Intent[]> {
    const response = await this.sdk.request("GET", "/intents");
    return response.intents;
  }

  async cancel(id: string): Promise<void> {
    await this.sdk.request("POST", `/intents/${id}/cancel`, {});
  }
}
