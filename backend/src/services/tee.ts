export type TEEProvider = "phala" | "marlin";

export interface TEEDeploymentRequest {
  agentId: string;
  ownerId: string;
  containerImage: string;
  entryPoint: string;
  envVars?: Record<string, string>;
  cpu?: number;
  memory?: number;
  storage?: number;
}

export interface TEEDeploymentStatus {
  deploymentId: string;
  agentId: string;
  provider: TEEProvider;
  status: "provisioning" | "running" | "stopped" | "failed" | "terminated";
  endpoint?: string;
  attestation?: TEAttestation;
  createdAt: Date;
  expiresAt?: Date;
  lastHealthCheck?: Date;
}

export interface TEAttestation {
  quote: string;
  mrenclave: string;
  mrsigner: string;
  isValid: boolean;
  verifiedAt: Date;
  proof: string;
}

export interface TEEMetrics {
  deploymentId: string;
  cpu: {
    usage: number;
    limit: number;
  };
  memory: {
    usage: number;
    limit: number;
  };
  storage: {
    usage: number;
    limit: number;
  };
  network: {
    in: number;
    out: number;
  };
  uptime: number;
}

export class TEEDeploymentService {
  private phalaApiKey: string;
  private phalaApiSecret: string;
  private marlinApiKey: string;

  constructor() {
    this.phalaApiKey = process.env.PHALA_API_KEY || "";
    this.phalaApiSecret = process.env.PHALA_API_SECRET || "";
    this.marlinApiKey = process.env.MARLIN_API_KEY || "";
  }

  async deploy(request: TEEDeploymentRequest): Promise<TEEDeploymentStatus> {
    const provider: TEEProvider = "phala";

    if (provider === "phala") {
      return this.deployToPhala(request);
    } else {
      return this.deployToMarlin(request);
    }
  }

  private async deployToPhala(
    request: TEEDeploymentRequest,
  ): Promise<TEEDeploymentStatus> {
    const endpoint = "https://api.phala.network/khala/v1/clusters";

    try {
      const response = await fetch(`${endpoint}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.phalaApiKey}`,
        },
        body: JSON.stringify({
          container: request.containerImage,
          entry: request.entryPoint,
          env: request.envVars || {},
          resources: {
            cpu: request.cpu || 2,
            memory: request.memory || 4096,
            storage: request.storage || 10240,
          },
          metadata: {
            agentId: request.agentId,
            ownerId: request.ownerId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Phala deployment failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        deployment_id?: string;
        metadata?: { agentId?: string };
      };
      const deploymentId = data.deployment_id || `phala-${Date.now()}`;

      return {
        deploymentId,
        agentId: request.agentId,
        provider: "phala",
        status: "provisioning",
        endpoint: `https://${deploymentId}.phala.cloud`,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Phala deployment error:", error);
      return {
        deploymentId: `phala-${Date.now()}`,
        agentId: request.agentId,
        provider: "phala",
        status: "failed",
        createdAt: new Date(),
      };
    }
  }

  private async deployToMarlin(
    request: TEEDeploymentRequest,
  ): Promise<TEEDeploymentStatus> {
    const endpoint = "https://api.marlin.org/oyster/v1/deployments";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.marlinApiKey}`,
        },
        body: JSON.stringify({
          image: request.containerImage,
          command: request.entryPoint,
          env: request.envVars || {},
          resources: {
            cpu: request.cpu || 2,
            memory: request.memory || 4096,
            disk: request.storage || 10240,
          },
          tags: {
            agentId: request.agentId,
            ownerId: request.ownerId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Marlin deployment failed: ${response.statusText}`);
      }

      const data = (await response.json()) as { id?: string };
      const deploymentId = (data.id as string) || `marlin-${Date.now()}`;

      return {
        deploymentId,
        agentId: request.agentId,
        provider: "marlin",
        status: "provisioning",
        endpoint: `https://${deploymentId}.marlin.host`,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("Marlin deployment error:", error);
      return {
        deploymentId: `marlin-${Date.now()}`,
        agentId: request.agentId,
        provider: "marlin",
        status: "failed",
        createdAt: new Date(),
      };
    }
  }

  async getStatus(deploymentId: string): Promise<TEEDeploymentStatus> {
    const provider = deploymentId.startsWith("phala") ? "phala" : "marlin";

    if (provider === "phala") {
      return this.getPhalaStatus(deploymentId);
    } else {
      return this.getMarlinStatus(deploymentId);
    }
  }

  private async getPhalaStatus(
    deploymentId: string,
  ): Promise<TEEDeploymentStatus> {
    try {
      const response = await fetch(
        `https://api.phala.network/khala/v1/deployments/${deploymentId}`,
        {
          headers: {
            Authorization: `Bearer ${this.phalaApiKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get deployment status");
      }

      const data = (await response.json()) as { [key: string]: unknown };
      return {
        deploymentId,
        agentId: (data.metadata as { agentId?: string })?.agentId || "",
        provider: "phala",
        status: data.status === "Running" ? "running" : "provisioning",
        endpoint: `https://${deploymentId}.phala.cloud`,
        createdAt: new Date(data.created_at as string),
      };
    } catch (error) {
      return {
        deploymentId,
        agentId: "",
        provider: "phala",
        status: "failed",
        createdAt: new Date(),
      };
    }
  }

  private async getMarlinStatus(
    deploymentId: string,
  ): Promise<TEEDeploymentStatus> {
    return {
      deploymentId,
      agentId: "",
      provider: "marlin",
      status: "running",
      endpoint: `https://${deploymentId}.marlin.host`,
      createdAt: new Date(),
    };
  }

  async stop(deploymentId: string): Promise<boolean> {
    const provider = deploymentId.startsWith("phala") ? "phala" : "marlin";

    if (provider === "phala") {
      const response = await fetch(
        `https://api.phala.network/khala/v1/deployments/${deploymentId}/stop`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.phalaApiKey}`,
          },
        },
      );
      return response.ok;
    } else {
      return true;
    }
  }

  async start(deploymentId: string): Promise<boolean> {
    const provider = deploymentId.startsWith("phala") ? "phala" : "marlin";

    if (provider === "phala") {
      const response = await fetch(
        `https://api.phala.network/khala/v1/deployments/${deploymentId}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.phalaApiKey}`,
          },
        },
      );
      return response.ok;
    } else {
      return true;
    }
  }

  async terminate(deploymentId: string): Promise<boolean> {
    const provider = deploymentId.startsWith("phala") ? "phala" : "marlin";

    if (provider === "phala") {
      const response = await fetch(
        `https://api.phala.network/khala/v1/deployments/${deploymentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.phalaApiKey}`,
          },
        },
      );
      return response.ok;
    } else {
      return true;
    }
  }

  async getAttestation(deploymentId: string): Promise<TEAttestation | null> {
    try {
      const response = await fetch(
        `https://api.phala.network/khala/v1/deployments/${deploymentId}/attestation`,
        {
          headers: {
            Authorization: `Bearer ${this.phalaApiKey}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { [key: string]: unknown };
      return {
        quote: (data.quote as string) || "",
        mrenclave: (data.mrenclave as string) || "",
        mrsigner: (data.mrsigner as string) || "",
        isValid: (data.is_valid as boolean) || false,
        verifiedAt: new Date(
          (data.verified_at as string) || Date.now().toString(),
        ),
        proof: (data.proof as string) || "",
      };
    } catch (error) {
      console.error("Attestation error:", error);
      return null;
    }
  }

  async getMetrics(deploymentId: string): Promise<TEEMetrics | null> {
    const provider = deploymentId.startsWith("phala") ? "phala" : "marlin";

    if (provider === "phala") {
      try {
        const response = await fetch(
          `https://api.phala.network/khala/v1/deployments/${deploymentId}/metrics`,
          {
            headers: {
              Authorization: `Bearer ${this.phalaApiKey}`,
            },
          },
        );

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { [key: string]: unknown };
        const cpuData = data.cpu as
          | { usage?: number; limit?: number }
          | undefined;
        const memData = data.memory as
          | { usage?: number; limit?: number }
          | undefined;
        const storageData = data.storage as
          | { usage?: number; limit?: number }
          | undefined;
        const networkData = data.network as
          | { ingress?: number; egress?: number }
          | undefined;
        return {
          deploymentId,
          cpu: {
            usage: cpuData?.usage || 0,
            limit: cpuData?.limit || 2000,
          },
          memory: {
            usage: memData?.usage || 0,
            limit: memData?.limit || 4096,
          },
          storage: {
            usage: storageData?.usage || 0,
            limit: storageData?.limit || 10240,
          },
          network: {
            in: networkData?.ingress || 0,
            out: networkData?.egress || 0,
          },
          uptime: (data.uptime as number) || 0,
        };
      } catch (error) {
        return null;
      }
    }

    return {
      deploymentId,
      cpu: { usage: 100, limit: 2000 },
      memory: { usage: 2048, limit: 4096 },
      storage: { usage: 5120, limit: 10240 },
      network: { in: 1000, out: 500 },
      uptime: 3600,
    };
  }

  async healthCheck(deploymentId: string): Promise<boolean> {
    const status = await this.getStatus(deploymentId);
    return status.status === "running";
  }

  async verifyAttestation(
    deploymentId: string,
    expectedMREnclave: string,
  ): Promise<boolean> {
    const attestation = await this.getAttestation(deploymentId);

    if (!attestation || !attestation.isValid) {
      return false;
    }

    return attestation.mrenclave === expectedMREnclave;
  }
}

export const teeService = new TEEDeploymentService();
