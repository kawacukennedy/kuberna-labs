export const blockchainListenerConfig = {
  chains: {
    base: {
      rpc: process.env.BASE_SEPOLIA_RPC_URL || process.env.ETHEREUM_RPC_URL || "https://sepolia.base.org",
      wsRpc: process.env.ETHEREUM_WS_RPC_URL || "wss://sepolia.base.org",
      contracts: {
        escrow: process.env.ESCROW_CONTRACT_ADDRESS || process.env.ETHEREUM_ESCROW_CONTRACT || "",
        intent: process.env.INTENT_CONTRACT_ADDRESS || process.env.ETHEREUM_INTENT_CONTRACT || "",
        certificate: process.env.CERTIFICATE_NFT_CONTRACT_ADDRESS || process.env.ETHEREUM_CERTIFICATE_CONTRACT || "",
        attestation: process.env.ATTESTATION_CONTRACT_ADDRESS || process.env.ETHEREUM_ATTESTATION_CONTRACT || "",
        payment: process.env.PAYMENT_CONTRACT_ADDRESS || "",
        subscription: process.env.SUBSCRIPTION_CONTRACT_ADDRESS || "",
        reputation: process.env.REPUTATION_NFT_CONTRACT_ADDRESS || "",
        agentRegistry: process.env.AGENT_REGISTRY_CONTRACT_ADDRESS || "",
        courseNft: process.env.COURSE_NFT_CONTRACT_ADDRESS || "",
        workshop: process.env.WORKSHOP_CONTRACT_ADDRESS || "",
        dispute: process.env.DISPUTE_CONTRACT_ADDRESS || "",
        treasury: process.env.TREASURY_CONTRACT_ADDRESS || "",
        feeManager: process.env.FEE_MANAGER_CONTRACT_ADDRESS || "",
        crossChainRouter: process.env.CROSSCHAIN_ROUTER_CONTRACT_ADDRESS || "",
      },
    },
    polygon: {
      rpc: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      wsRpc: process.env.POLYGON_WS_RPC_URL || "wss://polygon-rpc.com",
      contracts: {
        escrow: process.env.POLYGON_ESCROW_CONTRACT || process.env.ESCROW_CONTRACT_ADDRESS || "",
        intent: process.env.POLYGON_INTENT_CONTRACT || process.env.INTENT_CONTRACT_ADDRESS || "",
        certificate: process.env.POLYGON_CERTIFICATE_CONTRACT || process.env.CERTIFICATE_NFT_CONTRACT_ADDRESS || "",
        attestation: process.env.POLYGON_ATTESTATION_CONTRACT || process.env.ATTESTATION_CONTRACT_ADDRESS || "",
      },
    },
    arbitrum: {
      rpc: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      wsRpc: process.env.ARBITRUM_WS_RPC_URL || "wss://arb1.arbitrum.io/ws",
      contracts: {
        escrow: process.env.ARBITRUM_ESCROW_CONTRACT || process.env.ESCROW_CONTRACT_ADDRESS || "",
        intent: process.env.ARBITRUM_INTENT_CONTRACT || process.env.INTENT_CONTRACT_ADDRESS || "",
        certificate: process.env.ARBITRUM_CERTIFICATE_CONTRACT || process.env.CERTIFICATE_NFT_CONTRACT_ADDRESS || "",
        attestation: process.env.ARBITRUM_ATTESTATION_CONTRACT || process.env.ATTESTATION_CONTRACT_ADDRESS || "",
      },
    },
  },
  pollInterval: parseInt(process.env.POLL_INTERVAL || "60000", 10),
  confirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS || "3", 10),
  natsUrl: process.env.NATS_URL || "nats://localhost:4222",
};
