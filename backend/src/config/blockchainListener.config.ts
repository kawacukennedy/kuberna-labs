const allContracts = {
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
};

const chainContracts = (prefix: string) => ({
  escrow: process.env[`${prefix}_ESCROW_CONTRACT`] || allContracts.escrow,
  intent: process.env[`${prefix}_INTENT_CONTRACT`] || allContracts.intent,
  certificate: process.env[`${prefix}_CERTIFICATE_CONTRACT`] || allContracts.certificate,
  attestation: process.env[`${prefix}_ATTESTATION_CONTRACT`] || allContracts.attestation,
  payment: process.env[`${prefix}_PAYMENT_CONTRACT`] || allContracts.payment,
  subscription: process.env[`${prefix}_SUBSCRIPTION_CONTRACT`] || allContracts.subscription,
  reputation: process.env[`${prefix}_REPUTATION_CONTRACT`] || allContracts.reputation,
  agentRegistry: process.env[`${prefix}_AGENT_REGISTRY_CONTRACT`] || allContracts.agentRegistry,
  courseNft: process.env[`${prefix}_COURSE_NFT_CONTRACT`] || allContracts.courseNft,
  workshop: process.env[`${prefix}_WORKSHOP_CONTRACT`] || allContracts.workshop,
  dispute: process.env[`${prefix}_DISPUTE_CONTRACT`] || allContracts.dispute,
  treasury: process.env[`${prefix}_TREASURY_CONTRACT`] || allContracts.treasury,
  feeManager: process.env[`${prefix}_FEE_MANAGER_CONTRACT`] || allContracts.feeManager,
  crossChainRouter: process.env[`${prefix}_CROSSCHAIN_ROUTER_CONTRACT`] || allContracts.crossChainRouter,
});

export const blockchainListenerConfig = {
  chains: {
    base: {
      rpc: process.env.BASE_SEPOLIA_RPC_URL || process.env.ETHEREUM_RPC_URL || "https://sepolia.base.org",
      wsRpc: process.env.BASE_SEPOLIA_WS_RPC_URL || process.env.ETHEREUM_WS_RPC_URL || "wss://sepolia.base.org",
      contracts: { ...allContracts },
    },
    sepolia: {
      rpc: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      wsRpc: process.env.SEPOLIA_WS_RPC_URL || "wss://rpc.sepolia.org",
      contracts: chainContracts("SEPOLIA"),
    },
    polygon: {
      rpc: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      wsRpc: process.env.POLYGON_WS_RPC_URL || "wss://polygon-rpc.com",
      contracts: chainContracts("POLYGON"),
    },
    arbitrum: {
      rpc: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      wsRpc: process.env.ARBITRUM_WS_RPC_URL || "wss://arb1.arbitrum.io/ws",
      contracts: chainContracts("ARBITRUM"),
    },
    ogTestnet: {
      rpc: process.env.OG_RPC_URL || process.env.OG_TESTNET_RPC_URL || "https://evmrpc-testnet.0g.ai",
      wsRpc: process.env.OG_WS_RPC_URL || process.env.OG_TESTNET_WS_RPC_URL || "wss://evmrpc-testnet.0g.ai",
      contracts: chainContracts("OG"),
    },
  },
  pollInterval: parseInt(process.env.POLL_INTERVAL || "60000", 10),
  confirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS || "3", 10),
  natsUrl: process.env.NATS_URL || "nats://localhost:4222",
};
