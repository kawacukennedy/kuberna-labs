export const blockchainListenerConfig = {
  chains: {
    ethereum: {
      rpc: process.env.ETHEREUM_RPC_URL || "http://localhost:8545",
      wsRpc: process.env.ETHEREUM_WS_RPC_URL || "ws://localhost:8545",
      contracts: {
        escrow: process.env.ETHEREUM_ESCROW_CONTRACT || "",
        intent: process.env.ETHEREUM_INTENT_CONTRACT || "",
        certificate: process.env.ETHEREUM_CERTIFICATE_CONTRACT || "",
        attestation: process.env.ETHEREUM_ATTESTATION_CONTRACT || "",
      },
    },
    polygon: {
      rpc: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      wsRpc: process.env.POLYGON_WS_RPC_URL || "wss://polygon-rpc.com",
      contracts: {
        escrow: process.env.POLYGON_ESCROW_CONTRACT || "",
        intent: process.env.POLYGON_INTENT_CONTRACT || "",
        certificate: process.env.POLYGON_CERTIFICATE_CONTRACT || "",
        attestation: process.env.POLYGON_ATTESTATION_CONTRACT || "",
      },
    },
    arbitrum: {
      rpc: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      wsRpc: process.env.ARBITRUM_WS_RPC_URL || "wss://arb1.arbitrum.io/ws",
      contracts: {
        escrow: process.env.ARBITRUM_ESCROW_CONTRACT || "",
        intent: process.env.ARBITRUM_INTENT_CONTRACT || "",
        certificate: process.env.ARBITRUM_CERTIFICATE_CONTRACT || "",
        attestation: process.env.ARBITRUM_ATTESTATION_CONTRACT || "",
      },
    },
  },
  pollInterval: parseInt(process.env.POLL_INTERVAL || "60000", 10), // 1 minute
  confirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS || "3", 10),
  natsUrl: process.env.NATS_URL || "nats://localhost:4222",
};
