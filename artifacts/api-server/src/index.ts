import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"]) || 3000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

const server = app.listen(port, () => {
  logger.info({ port }, "Server listening");
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutdown signal received");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Unhandled rejection handler
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});
