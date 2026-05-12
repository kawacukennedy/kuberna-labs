import { createBlockchainListener } from "../services/blockchainListener.js";
import { blockchainListenerConfig } from "../config/blockchainListener.config.js";
import logger from "../utils/logger.js";

async function main() {
  logger.info("Starting Blockchain Listener...");

  const listener = createBlockchainListener(blockchainListenerConfig);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("\nReceived SIGINT, shutting down gracefully...");
    await listener.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("\nReceived SIGTERM, shutting down gracefully...");
    await listener.stop();
    process.exit(0);
  });

  try {
    await listener.start();
    logger.info("Blockchain Listener is running. Press Ctrl+C to stop.");
  } catch (error) {
    logger.error("Failed to start Blockchain Listener:", error);
    process.exit(1);
  }
}

main();
