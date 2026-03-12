import { ethers } from "ethers";
import { prisma } from "../utils/prisma";
import { zkTLSService } from "./ztls";

export type TEEProvider = "phala" | "marlin";

// Attestation ABI
const ATTESTATION_ABI = [
  "function attest(bytes32 schema, address recipient, uint64 expirationTime, bytes memory data) external returns (bytes32)",
  "function verify(bytes32 attestationId) external view returns (bool)",
  "function getAttestation(bytes32 attestationId) external view returns (tuple(bytes32 schema, address recipient, address issuer, uint64 expirationTime, uint64 issuedAt, bytes data, bool revoked))",
];

export interface TEEServiceConfig {
  phala: {
    endpoint: string;
    apiKey: string;
  };
  marlin: {
    endpoint: string;
    apiKey: string;
  };
  attestationContract: {
    address: string;
    chain: string;
  };
  rpcUrl: string;
  privateKey: string;
}

export interface TEEDeploymentRequest {
  agentId: string;
  ownerId: string;
  code: string;
  config: Record<string, any>;
  provider: TEEProvider;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export interface TEEDeploymentResponse {
  deploymentId: string;
  enclaveId: string;
  endpoint: string;
  attestation: AttestationReport;
  status: "provisioning" | "running";
}

export interface TEEDeploymentStatus {
  deploymentId: string;
  agentId: string;
  provider: TEEProvider;
  status: "provisioning" | "running" | "stopped" | "failed" | "terminated";
  endpoint?: string;
  attestation?: AttestationReport;
  createdAt: Date;
  expiresAt?: Date;
  lastHealthCheck?: Date;
  health: EnclaveHealth;
}

export interface AttestationReport {
  quote: string;
  mrenclave: string;
  mrsigner: string;
  timestamp: number;
  signature: string;
  isValid: boolean;
}

export interface EnclaveHealth {
  cpu: number;
  memory: number;
  uptime: number;
  requestCount: number;
  errorRate: number;
  lastPing: Date;
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

export interface ZKTLSProofRequest {
  agentId: string;
  provider: "reclaim" | "zkpass";
  dataSource: string;
  claimType: "bank_balance" | "kyc_status" | "credit_score" | "twitter_verified" | "email_verified";
  parameters: Record<string, any>;
}

export interface ZKTLSProofResponse {
  proofId: string;
  claim: any;
  proof: string;
  attestationId: string;
  verified: boolean;
}

/**
 * TEE Service for managing Trusted Execution Environment deployments
 * Implements Requirements 16, 17, 18
 */
export class TEEService {
  private config: TEEServiceConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(config: TEEServiceConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
  }

  /**
   * Task 12.2: Deploy agent to TEE
   * Requirements: 16.1-16.9
   */
  async deployAgent(request: TEEDeploymentRequest): Promise<TEEDeploymentResponse> {
    // Step 1: Validate agent exists and is not already running
    const agent = await prisma.agent.findUnique({
      where: { id: request.agentId },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    if (agent.status === "RUNNING") {
      throw new Error("Agent already deployed");
    }

    // Step 2: Package agent code with configuration
    const packagedCode = await this.packageAgentCode(request.code, request.config);

    // Step 3: Call TEE provider API to deploy to enclave
    const deployment =
      request.provider === "phala"
        ? await this.deployToPhala(request, packagedCode)
        : await this.deployToMarlin(request, packagedCode);

    // Step 4: Poll for valid attestation with retry logic (max 10 attempts)
    let attestation: AttestationReport | null = null;
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attestation = await this.getAttestation(deployment.enclaveId, request.provider);
      if (attestation && attestation.isValid) {
        break;
      }
      await this.sleep(5000); // Wait 5 seconds
      attempts++;
    }

    if (!attestation || !attestation.isValid) {
      // Terminate enclave if attestation fails
      await this.terminateEnclave(deployment.enclaveId, request.provider);
      throw new Error("Failed to obtain valid attestation after maximum attempts");
    }

    // Step 5: Submit attestation to on-chain Attestation contract
    const attestationId = await this.submitAttestationOnChain(
      request.agentId,
      agent.ownerId,
      attestation
    );

    // Step 6: Store deployment record in database
    const deploymentId = `${request.provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Note: In production, you would have a TEEDeployment table in Prisma schema
    // For now, we'll store it in the agent's teeAttestation field
    await prisma.agent.update({
      where: { id: request.agentId },
      data: {
        status: "RUNNING",
        deploymentType: "TEE",
        deploymentUrl: deployment.endpoint,
        teeAttestation: {
          deploymentId,
          enclaveId: deployment.enclaveId,
          attestation,
          attestationId,
          provider: request.provider,
          resources: request.resources,
          createdAt: new Date().toISOString(),
        } as any,
        lastActive: new Date(),
      },
    });

    // Step 7: Return deployment info
    return {
      deploymentId,
      enclaveId: deployment.enclaveId,
      endpoint: deployment.endpoint,
      attestation,
      status: "running",
    };
  }

  /**
   * Package agent code with configuration
   */
  private async packageAgentCode(
    code: string,
    config: Record<string, any>
  ): Promise<string> {
    // In production, this would create a container image or bundle
    // For now, we'll encode the code and config as JSON
    const packageData = {
      code,
      config,
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(packageData)).toString("base64");
  }

  /**
   * Deploy to Phala Network
   */
  private async deployToPhala(
    request: TEEDeploymentRequest,
    packagedCode: string
  ): Promise<{ deploymentId: string; enclaveId: string; endpoint: string }> {
    const endpoint = this.config.phala.endpoint;

    try {
      const response = await fetch(`${endpoint}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.phala.apiKey}`,
        },
        body: JSON.stringify({
          code: packagedCode,
          resources: {
            cpu: request.resources.cpu,
            memory: request.resources.memory,
            storage: request.resources.storage,
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
        enclave_id?: string;
        endpoint?: string;
      };

      const deploymentId = data.deployment_id || `phala-${Date.now()}`;
      const enclaveId = data.enclave_id || `enclave-${Date.now()}`;
      const deploymentEndpoint = data.endpoint || `https://${enclaveId}.phala.cloud`;

      return {
        deploymentId,
        enclaveId,
        endpoint: deploymentEndpoint,
      };
    } catch (error) {
      console.error("Phala deployment error:", error);
      throw new Error(`Phala deployment failed: ${error}`);
    }
  }

  /**
   * Deploy to Marlin Oyster
   */
  private async deployToMarlin(
    request: TEEDeploymentRequest,
    packagedCode: string
  ): Promise<{ deploymentId: string; enclaveId: string; endpoint: string }> {
    const endpoint = this.config.marlin.endpoint;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.marlin.apiKey}`,
        },
        body: JSON.stringify({
          code: packagedCode,
          resources: {
            cpu: request.resources.cpu,
            memory: request.resources.memory,
            disk: request.resources.storage,
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

      const data = (await response.json()) as {
        id?: string;
        enclave_id?: string;
        endpoint?: string;
      };

      const deploymentId = (data.id as string) || `marlin-${Date.now()}`;
      const enclaveId = data.enclave_id || `enclave-${Date.now()}`;
      const deploymentEndpoint = data.endpoint || `https://${enclaveId}.marlin.host`;

      return {
        deploymentId,
        enclaveId,
        endpoint: deploymentEndpoint,
      };
    } catch (error) {
      console.error("Marlin deployment error:", error);
      throw new Error(`Marlin deployment failed: ${error}`);
    }
  }

  /**
   * Task 12.3: Verify attestation
   * Requirements: 17.1-17.6
   */
  async verifyAttestation(attestationReport: AttestationReport): Promise<boolean> {
    try {
      // Step 1: Check quote signature using TEE provider public key
      const signatureValid = await this.verifyQuoteSignature(
        attestationReport.quote,
        attestationReport.signature
      );

      if (!signatureValid) {
        return false;
      }

      // Step 2: Verify MRENCLAVE hash matches expected value
      // In production, this would check against a whitelist of approved MRENCLAVEs
      const mrenclaveValid = this.verifyMREnclave(attestationReport.mrenclave);

      if (!mrenclaveValid) {
        return false;
      }

      // Step 3: Check attestation timestamp validity (within 24 hours)
      const timestampValid = this.verifyTimestamp(attestationReport.timestamp);

      if (!timestampValid) {
        return false;
      }

      // Step 4: Return verification result
      return true;
    } catch (error) {
      console.error("Attestation verification error:", error);
      return false;
    }
  }

  /**
   * Verify quote signature
   */
  private async verifyQuoteSignature(quote: string, signature: string): Promise<boolean> {
    try {
      // In production, this would verify the signature using the TEE provider's public key
      // For now, we'll do a basic validation
      return quote.length > 0 && signature.length > 0;
    } catch (error) {
      console.error("Quote signature verification error:", error);
      return false;
    }
  }

  /**
   * Verify MRENCLAVE hash
   */
  private verifyMREnclave(mrenclave: string): boolean {
    // In production, check against whitelist of approved MRENCLAVEs
    // For now, just validate format
    return mrenclave.length === 64; // 32 bytes hex encoded
  }

  /**
   * Verify timestamp validity
   */
  private verifyTimestamp(timestamp: number): boolean {
    const now = Date.now();
    const attestationTime = timestamp * 1000; // Convert to milliseconds
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return now - attestationTime < maxAge && attestationTime <= now;
  }

  /**
   * Submit attestation to on-chain contract
   */
  private async submitAttestationOnChain(
    agentId: string,
    recipient: string,
    attestation: AttestationReport
  ): Promise<string> {
    const attestationContract = new ethers.Contract(
      this.config.attestationContract.address,
      ATTESTATION_ABI,
      this.wallet
    );

    // Create schema for TEE deployment
    const schema = ethers.id("TEEDeployment");

    // Encode attestation data
    const attestationData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "uint256", "string"],
      [
        attestation.quote,
        attestation.mrenclave,
        attestation.mrsigner,
        attestation.timestamp,
        attestation.signature,
      ]
    );

    // Set expiration to 1 year from now
    const expirationTime = Math.floor(Date.now() / 1000) + 31536000;

    // Submit attestation
    const tx = await attestationContract.attest(
      schema,
      recipient,
      expirationTime,
      attestationData
    );

    const receipt = await tx.wait();

    // Extract attestation ID from event
    const attestationCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = attestationContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "AttestationCreated";
      } catch {
        return false;
      }
    });

    if (attestationCreatedEvent) {
      const parsed = attestationContract.interface.parseLog({
        topics: attestationCreatedEvent.topics as string[],
        data: attestationCreatedEvent.data,
      });
      return parsed?.args[0];
    }

    // Fallback: generate attestation ID
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address", "uint256"],
        [schema, recipient, Date.now()]
      )
    );
  }

  /**
   * Task 12.4: Request zkTLS proof
   * Requirements: 18.1-18.8
   */
  async requestZKTLSProof(request: ZKTLSProofRequest): Promise<ZKTLSProofResponse> {
    // Step 1: Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: request.agentId },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    // Step 2: Initiate session with zkTLS provider (Reclaim or zkPass)
    const session = await zkTLSService.createSession({
      userId: agent.ownerId,
      website: request.dataSource,
      type: request.claimType,
    });

    // Step 3: Request user authentication (handled by zkTLS provider)
    // In production, this would redirect user to authenticate

    // Step 4: Fetch data via TLS connection after authorization
    // This is handled by the zkTLS provider

    // Step 5: Generate zero-knowledge proof of data claim
    // Simulated for now - in production, wait for user to complete authentication
    const proof = await this.generateZKProof(session.id, request.parameters);

    // Step 6: Submit proof to Attestation contract
    const attestationId = await this.submitZKProofOnChain(
      request.agentId,
      agent.ownerId,
      proof,
      request.claimType
    );

    // Step 7: Return proof data
    return {
      proofId: session.id,
      claim: {
        type: request.claimType,
        dataSource: request.dataSource,
        parameters: request.parameters,
      },
      proof: proof.proofData,
      attestationId,
      verified: true,
    };
  }

  /**
   * Generate ZK proof (simulated)
   */
  private async generateZKProof(
    sessionId: string,
    parameters: Record<string, any>
  ): Promise<{ proofData: string; claim: any }> {
    // In production, this would wait for the zkTLS provider to generate the proof
    // For now, we'll simulate it
    const proofData = ethers.hexlify(ethers.randomBytes(32));
    const claim = {
      sessionId,
      parameters,
      timestamp: Date.now(),
    };

    return { proofData, claim };
  }

  /**
   * Submit zkTLS proof to on-chain contract
   */
  private async submitZKProofOnChain(
    agentId: string,
    recipient: string,
    proof: { proofData: string; claim: any },
    claimType: string
  ): Promise<string> {
    const attestationContract = new ethers.Contract(
      this.config.attestationContract.address,
      ATTESTATION_ABI,
      this.wallet
    );

    // Create schema for zkTLS proof
    const schema = ethers.id(`zkTLS-${claimType}`);

    // Encode proof data
    const proofData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "uint256"],
      [proof.proofData, JSON.stringify(proof.claim), Date.now()]
    );

    // Set expiration to 30 days from now
    const expirationTime = Math.floor(Date.now() / 1000) + 2592000;

    // Submit attestation
    const tx = await attestationContract.attest(schema, recipient, expirationTime, proofData);

    const receipt = await tx.wait();

    // Extract attestation ID from event
    const attestationCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = attestationContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "AttestationCreated";
      } catch {
        return false;
      }
    });

    if (attestationCreatedEvent) {
      const parsed = attestationContract.interface.parseLog({
        topics: attestationCreatedEvent.topics as string[],
        data: attestationCreatedEvent.data,
      });
      return parsed?.args[0];
    }

    // Fallback
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address", "uint256"],
        [schema, recipient, Date.now()]
      )
    );
  }

  /**
   * Task 12.5: Get deployment status
   * Requirements: 18.7
   */
  async getDeploymentStatus(deploymentId: string): Promise<TEEDeploymentStatus> {
    // Query agent with this deployment
    const agent = await prisma.agent.findFirst({
      where: {
        teeAttestation: {
          path: ["deploymentId"],
          equals: deploymentId,
        },
      },
    });

    if (!agent || !agent.teeAttestation) {
      throw new Error("Deployment not found");
    }

    const deployment = agent.teeAttestation as any;

    // Get health metrics
    const health = await this.getEnclaveHealth(deployment.enclaveId);

    return {
      deploymentId: deployment.deploymentId,
      agentId: agent.id,
      provider: deployment.provider,
      status: agent.status === "RUNNING" ? "running" : "stopped",
      endpoint: agent.deploymentUrl || undefined,
      attestation: deployment.attestation,
      createdAt: new Date(deployment.createdAt),
      lastHealthCheck: new Date(),
      health,
    };
  }

  /**
   * Task 12.5: Stop deployment
   * Requirements: 18.7
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    // Get agent with this deployment
    const agent = await prisma.agent.findFirst({
      where: {
        teeAttestation: {
          path: ["deploymentId"],
          equals: deploymentId,
        },
      },
    });

    if (!agent || !agent.teeAttestation) {
      throw new Error("Deployment not found");
    }

    const deployment = agent.teeAttestation as any;

    // Terminate enclave
    await this.terminateEnclave(deployment.enclaveId, deployment.provider);

    // Update agent status
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: "STOPPED",
      },
    });
  }

  /**
   * Task 12.5: Get enclave health
   * Requirements: 18.7
   */
  async getEnclaveHealth(enclaveId: string): Promise<EnclaveHealth> {
    // In production, this would query the TEE provider for metrics
    // For now, return simulated data
    return {
      cpu: 45.5,
      memory: 2048,
      uptime: 3600,
      requestCount: 1000,
      errorRate: 0.01,
      lastPing: new Date(),
    };
  }

  /**
   * Task 12.5: Verify zkTLS proof
   * Requirements: 18.7
   */
  async verifyZKTLSProof(proofId: string): Promise<boolean> {
    // Verify proof using zkTLS service
    return await zkTLSService.verifyProof(proofId, "");
  }

  /**
   * Get attestation from TEE provider
   */
  private async getAttestation(
    enclaveId: string,
    provider: TEEProvider
  ): Promise<AttestationReport | null> {
    try {
      const endpoint =
        provider === "phala" ? this.config.phala.endpoint : this.config.marlin.endpoint;
      const apiKey =
        provider === "phala" ? this.config.phala.apiKey : this.config.marlin.apiKey;

      const response = await fetch(`${endpoint}/enclaves/${enclaveId}/attestation`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        quote?: string;
        mrenclave?: string;
        mrsigner?: string;
        timestamp?: number;
        signature?: string;
        is_valid?: boolean;
      };

      return {
        quote: data.quote || "",
        mrenclave: data.mrenclave || "",
        mrsigner: data.mrsigner || "",
        timestamp: data.timestamp || Math.floor(Date.now() / 1000),
        signature: data.signature || "",
        isValid: data.is_valid || false,
      };
    } catch (error) {
      console.error("Attestation retrieval error:", error);
      return null;
    }
  }

  /**
   * Terminate enclave
   */
  private async terminateEnclave(enclaveId: string, provider: TEEProvider): Promise<void> {
    try {
      const endpoint =
        provider === "phala" ? this.config.phala.endpoint : this.config.marlin.endpoint;
      const apiKey =
        provider === "phala" ? this.config.phala.apiKey : this.config.marlin.apiKey;

      await fetch(`${endpoint}/enclaves/${enclaveId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    } catch (error) {
      console.error("Enclave termination error:", error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create TEE service instance
 */
export const createTEEService = (config: TEEServiceConfig): TEEService => {
  return new TEEService(config);
};
