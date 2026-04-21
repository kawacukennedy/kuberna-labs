import { TEEService, TEEServiceConfig, TEEDeploymentRequest, AttestationReport } from "../tee";
import { prisma } from "../../utils/prisma";
import { zkTLSService } from "../ztls";

// Mock dependencies
jest.mock("../../utils/prisma", () => ({
  prisma: {
    agent: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../ztls", () => ({
  zkTLSService: {
    createSession: jest.fn(),
    verifyProof: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("TEEService", () => {
  let teeService: TEEService;
  let mockConfig: TEEServiceConfig;

  beforeEach(() => {
    mockConfig = {
      phala: {
        endpoint: "https://api.phala.network",
        apiKey: "test-phala-key",
      },
      marlin: {
        endpoint: "https://api.marlin.org",
        apiKey: "test-marlin-key",
      },
      attestationContract: {
        address: "0x1234567890123456789012345678901234567890",
        chain: "ethereum",
      },
      rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/test",
      privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123",
    };

    teeService = new TEEService(mockConfig);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("deployAgent", () => {
    it("should deploy agent to Phala Network successfully", async () => {
      const mockAgent = {
        id: "agent-1",
        ownerId: "user-1",
        status: "DRAFT",
      };

      const mockDeploymentRequest: TEEDeploymentRequest = {
        agentId: "agent-1",
        ownerId: "user-1",
        code: "console.log('Hello TEE')",
        config: { env: "production" } as unknown as Record<string, string>,
        provider: "phala",
        resources: {
          cpu: 2,
          memory: 4096,
          storage: 10240,
        },
      };

      // Mock agent lookup
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);

      // Mock Phala deployment API
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deployment_id: "phala-deploy-123",
            enclave_id: "enclave-123",
            endpoint: "https://enclave-123.phala.cloud",
          }),
        })
        // Mock attestation API (first call - not valid)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            quote: "mock-quote",
            mrenclave: "a".repeat(64),
            mrsigner: "b".repeat(64),
            timestamp: Math.floor(Date.now() / 1000),
            signature: "mock-signature",
            is_valid: false,
          }),
        })
        // Mock attestation API (second call - valid)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            quote: "mock-quote",
            mrenclave: "a".repeat(64),
            mrsigner: "b".repeat(64),
            timestamp: Math.floor(Date.now() / 1000),
            signature: "mock-signature",
            is_valid: true,
          }),
        });

      // Mock agent update
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        ...mockAgent,
        status: "RUNNING",
      });

      const result = await teeService.deployAgent(mockDeploymentRequest);

      expect(result).toHaveProperty("deploymentId");
      expect(result).toHaveProperty("enclaveId", "enclave-123");
      expect(result).toHaveProperty("endpoint", "https://enclave-123.phala.cloud");
      expect(result).toHaveProperty("attestation");
      expect(result.attestation.isValid).toBe(true);
      expect(result.status).toBe("running");

      expect(prisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "agent-1" },
          data: expect.objectContaining({
            status: "RUNNING",
            deploymentType: "TEE",
          }),
        })
      );
    });

    it("should throw error if agent not found", async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      const mockDeploymentRequest: TEEDeploymentRequest = {
        agentId: "non-existent",
        ownerId: "user-1",
        code: "console.log('Hello')",
        config: {},
        provider: "phala",
        resources: { cpu: 2, memory: 4096, storage: 10240 },
      };

      await expect(teeService.deployAgent(mockDeploymentRequest)).rejects.toThrow(
        "Agent not found"
      );
    });

    it("should throw error if agent already running", async () => {
      const mockAgent = {
        id: "agent-1",
        ownerId: "user-1",
        status: "RUNNING",
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);

      const mockDeploymentRequest: TEEDeploymentRequest = {
        agentId: "agent-1",
        ownerId: "user-1",
        code: "console.log('Hello')",
        config: {},
        provider: "phala",
        resources: { cpu: 2, memory: 4096, storage: 10240 },
      };

      await expect(teeService.deployAgent(mockDeploymentRequest)).rejects.toThrow(
        "Agent already deployed"
      );
    });

    it("should terminate enclave if attestation fails after max attempts", async () => {
      const mockAgent = {
        id: "agent-1",
        ownerId: "user-1",
        status: "DRAFT",
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);

      // Mock Phala deployment API
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            deployment_id: "phala-deploy-123",
            enclave_id: "enclave-123",
            endpoint: "https://enclave-123.phala.cloud",
          }),
        })
        // Mock attestation API - always return invalid
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            quote: "mock-quote",
            mrenclave: "a".repeat(64),
            mrsigner: "b".repeat(64),
            timestamp: Math.floor(Date.now() / 1000),
            signature: "mock-signature",
            is_valid: false,
          }),
        });

      const mockDeploymentRequest: TEEDeploymentRequest = {
        agentId: "agent-1",
        ownerId: "user-1",
        code: "console.log('Hello')",
        config: {},
        provider: "phala",
        resources: { cpu: 2, memory: 4096, storage: 10240 },
      };

      await expect(teeService.deployAgent(mockDeploymentRequest)).rejects.toThrow(
        "Failed to obtain valid attestation after maximum attempts"
      );

      // Verify termination was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/enclaves/enclave-123"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("verifyAttestation", () => {
    it("should verify valid attestation", async () => {
      const mockAttestation: AttestationReport = {
        quote: "valid-quote",
        mrenclave: "a".repeat(64),
        mrsigner: "b".repeat(64),
        timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        signature: "valid-signature",
        isValid: true,
      };

      const result = await teeService.verifyAttestation(mockAttestation);

      expect(result).toBe(true);
    });

    it("should reject attestation with invalid MRENCLAVE", async () => {
      const mockAttestation: AttestationReport = {
        quote: "valid-quote",
        mrenclave: "invalid", // Too short
        mrsigner: "b".repeat(64),
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        signature: "valid-signature",
        isValid: true,
      };

      const result = await teeService.verifyAttestation(mockAttestation);

      expect(result).toBe(false);
    });

    it("should reject attestation with expired timestamp", async () => {
      const mockAttestation: AttestationReport = {
        quote: "valid-quote",
        mrenclave: "a".repeat(64),
        mrsigner: "b".repeat(64),
        timestamp: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
        signature: "valid-signature",
        isValid: true,
      };

      const result = await teeService.verifyAttestation(mockAttestation);

      expect(result).toBe(false);
    });

    it("should reject attestation with future timestamp", async () => {
      const mockAttestation: AttestationReport = {
        quote: "valid-quote",
        mrenclave: "a".repeat(64),
        mrsigner: "b".repeat(64),
        timestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour in future
        signature: "valid-signature",
        isValid: true,
      };

      const result = await teeService.verifyAttestation(mockAttestation);

      expect(result).toBe(false);
    });
  });

  describe("requestZKTLSProof", () => {
    it("should request zkTLS proof successfully", async () => {
      const mockAgent = {
        id: "agent-1",
        ownerId: "user-1",
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);

      (zkTLSService.createSession as jest.Mock).mockResolvedValue({
        id: "session-123",
        provider: "reclaim",
        userId: "user-1",
        website: "bankofamerica.com",
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
      });

      const result = await teeService.requestZKTLSProof({
        agentId: "agent-1",
        provider: "reclaim",
        dataSource: "bankofamerica.com",
        claimType: "bank_balance",
        parameters: { accountNumber: "****1234" },
      });

      expect(result).toHaveProperty("proofId", "session-123");
      expect(result).toHaveProperty("claim");
      expect(result).toHaveProperty("proof");
      expect(result).toHaveProperty("attestationId");
      expect(result.verified).toBe(true);

      expect(zkTLSService.createSession).toHaveBeenCalledWith({
        userId: "user-1",
        website: "bankofamerica.com",
        type: "bank_balance",
      });
    });

    it("should throw error if agent not found", async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        teeService.requestZKTLSProof({
          agentId: "non-existent",
          provider: "reclaim",
          dataSource: "bankofamerica.com",
          claimType: "bank_balance",
          parameters: {},
        })
      ).rejects.toThrow("Agent not found");
    });
  });

  describe("getDeploymentStatus", () => {
    it("should get deployment status successfully", async () => {
      const mockAgent = {
        id: "agent-1",
        status: "RUNNING",
        deploymentUrl: "https://enclave-123.phala.cloud",
        teeAttestation: {
          deploymentId: "phala-deploy-123",
          enclaveId: "enclave-123",
          provider: "phala",
          attestation: {
            quote: "mock-quote",
            mrenclave: "a".repeat(64),
            mrsigner: "b".repeat(64),
            timestamp: Math.floor(Date.now() / 1000),
            signature: "mock-signature",
            isValid: true,
          },
          createdAt: new Date().toISOString(),
        },
      };

      (prisma.agent.findFirst as jest.Mock).mockResolvedValue(mockAgent);

      const result = await teeService.getDeploymentStatus("phala-deploy-123");

      expect(result).toHaveProperty("deploymentId", "phala-deploy-123");
      expect(result).toHaveProperty("agentId", "agent-1");
      expect(result).toHaveProperty("provider", "phala");
      expect(result).toHaveProperty("status", "running");
      expect(result).toHaveProperty("health");
    });

    it("should throw error if deployment not found", async () => {
      (prisma.agent.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(teeService.getDeploymentStatus("non-existent")).rejects.toThrow(
        "Deployment not found"
      );
    });
  });

  describe("stopDeployment", () => {
    it("should stop deployment successfully", async () => {
      const mockAgent = {
        id: "agent-1",
        status: "RUNNING",
        teeAttestation: {
          deploymentId: "phala-deploy-123",
          enclaveId: "enclave-123",
          provider: "phala",
        },
      };

      (prisma.agent.findFirst as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        ...mockAgent,
        status: "STOPPED",
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await teeService.stopDeployment("phala-deploy-123");

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: "agent-1" },
        data: { status: "STOPPED" },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/enclaves/enclave-123"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("should throw error if deployment not found", async () => {
      (prisma.agent.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(teeService.stopDeployment("non-existent")).rejects.toThrow(
        "Deployment not found"
      );
    });
  });

  describe("verifyZKTLSProof", () => {
    it("should verify zkTLS proof successfully", async () => {
      (zkTLSService.verifyProof as jest.Mock).mockResolvedValue(true);

      const result = await teeService.verifyZKTLSProof("proof-123");

      expect(result).toBe(true);
      expect(zkTLSService.verifyProof).toHaveBeenCalledWith("proof-123", "");
    });

    it("should return false for invalid proof", async () => {
      (zkTLSService.verifyProof as jest.Mock).mockResolvedValue(false);

      const result = await teeService.verifyZKTLSProof("invalid-proof");

      expect(result).toBe(false);
    });
  });

  describe("getEnclaveHealth", () => {
    it("should return enclave health metrics", async () => {
      const result = await teeService.getEnclaveHealth("enclave-123");

      expect(result).toHaveProperty("cpu");
      expect(result).toHaveProperty("memory");
      expect(result).toHaveProperty("uptime");
      expect(result).toHaveProperty("requestCount");
      expect(result).toHaveProperty("errorRate");
      expect(result).toHaveProperty("lastPing");
      expect(result.lastPing).toBeInstanceOf(Date);
    });
  });
});
