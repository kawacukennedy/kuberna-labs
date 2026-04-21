/**
 * TEE Service Usage Examples
 * 
 * This file demonstrates how to use the TEE Service for deploying agents
 * to Trusted Execution Environments and managing zkTLS proofs.
 */

import { createTEEService, TEEServiceConfig } from "../tee";

// Example configuration
const config: TEEServiceConfig = {
  phala: {
    endpoint: process.env.PHALA_ENDPOINT || "https://api.phala.network",
    apiKey: process.env.PHALA_API_KEY || "",
  },
  marlin: {
    endpoint: process.env.MARLIN_ENDPOINT || "https://api.marlin.org",
    apiKey: process.env.MARLIN_API_KEY || "",
  },
  attestationContract: {
    address: process.env.ATTESTATION_CONTRACT_ADDRESS || "0x...",
    chain: "ethereum",
  },
  rpcUrl: process.env.RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/...",
  privateKey: process.env.PRIVATE_KEY || "0x...",
};

// Create TEE service instance
const teeService = createTEEService(config);

/**
 * Example 1: Deploy an agent to TEE
 */
async function deployAgentExample() {
  try {
    const deployment = await teeService.deployAgent({
      agentId: "agent-123",
      ownerId: "user-456",
      code: `
        // Agent code
        export async function execute(input) {
          // Process input securely in TEE
          return { result: "processed" };
        }
      `,
      config: { env: "production", timeout: "30000" } as unknown as Record<string, string>,
      provider: "phala", // or "marlin"
      resources: {
        cpu: 2,
        memory: 4096,
        storage: 10240,
      },
    });

    console.log("Agent deployed successfully!");
    console.log("Deployment ID:", deployment.deploymentId);
    console.log("Enclave ID:", deployment.enclaveId);
    console.log("Endpoint:", deployment.endpoint);
    console.log("Attestation valid:", deployment.attestation.isValid);
  } catch (error) {
    console.error("Deployment failed:", error);
  }
}

/**
 * Example 2: Verify attestation
 */
async function verifyAttestationExample() {
  const attestation = {
    quote: "...",
    mrenclave: "a".repeat(64),
    mrsigner: "b".repeat(64),
    timestamp: Math.floor(Date.now() / 1000),
    signature: "...",
    isValid: true,
  };

  const isValid = await teeService.verifyAttestation(attestation);
  console.log("Attestation valid:", isValid);
}

/**
 * Example 3: Request zkTLS proof for bank balance
 */
async function requestZKTLSProofExample() {
  try {
    const proof = await teeService.requestZKTLSProof({
      agentId: "agent-123",
      provider: "reclaim",
      dataSource: "bankofamerica.com",
      claimType: "bank_balance",
      parameters: {
        accountNumber: "****1234",
        minBalance: 10000,
      },
    });

    console.log("zkTLS proof generated!");
    console.log("Proof ID:", proof.proofId);
    console.log("Claim:", proof.claim);
    console.log("Attestation ID:", proof.attestationId);
    console.log("Verified:", proof.verified);
  } catch (error) {
    console.error("zkTLS proof generation failed:", error);
  }
}

/**
 * Example 4: Get deployment status
 */
async function getDeploymentStatusExample() {
  try {
    const status = await teeService.getDeploymentStatus("phala-deploy-123");

    console.log("Deployment status:", status.status);
    console.log("Endpoint:", status.endpoint);
    console.log("Health:");
    console.log("  CPU:", status.health.cpu, "%");
    console.log("  Memory:", status.health.memory, "MB");
    console.log("  Uptime:", status.health.uptime, "seconds");
    console.log("  Request count:", status.health.requestCount);
    console.log("  Error rate:", status.health.errorRate);
  } catch (error) {
    console.error("Failed to get deployment status:", error);
  }
}

/**
 * Example 5: Stop deployment
 */
async function stopDeploymentExample() {
  try {
    await teeService.stopDeployment("phala-deploy-123");
    console.log("Deployment stopped successfully");
  } catch (error) {
    console.error("Failed to stop deployment:", error);
  }
}

/**
 * Example 6: Verify zkTLS proof
 */
async function verifyZKTLSProofExample() {
  const isValid = await teeService.verifyZKTLSProof("proof-123");
  console.log("zkTLS proof valid:", isValid);
}

/**
 * Example 7: Get enclave health
 */
async function getEnclaveHealthExample() {
  const health = await teeService.getEnclaveHealth("enclave-123");

  console.log("Enclave health:");
  console.log("  CPU usage:", health.cpu, "%");
  console.log("  Memory usage:", health.memory, "MB");
  console.log("  Uptime:", health.uptime, "seconds");
  console.log("  Request count:", health.requestCount);
  console.log("  Error rate:", health.errorRate);
  console.log("  Last ping:", health.lastPing);
}

// Export examples for testing
export {
  deployAgentExample,
  verifyAttestationExample,
  requestZKTLSProofExample,
  getDeploymentStatusExample,
  stopDeploymentExample,
  verifyZKTLSProofExample,
  getEnclaveHealthExample,
};
