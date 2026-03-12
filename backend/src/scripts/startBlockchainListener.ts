import { createBlockchainListener } from "../services/blockchainListener.js";
import { blockchainListenerConfig } from "../config/blockchainListener.config.js";

async function main() {
  console.log("Starting Blockchain Listener...");

  const listener = createBlockchainListener(blockchainListenerConfig);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT, shutting down gracefully...");
    await listener.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM, shutting down gracefully...");
    await listener.stop();
    process.exit(0);
  });

  try {
    await listener.start();
    console.log("Blockchain Listener is running. Press Ctrl+C to stop.");
  } catch (error) {
    console.error("Failed to start Blockchain Listener:", error);
    process.exit(1);
  }
}

main();
