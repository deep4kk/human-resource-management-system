import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import app from "./app";
import { connectDB, disconnectDB } from "@hrms/db";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"]) || 3000;

const uploadsDir = resolve(process.cwd(), "uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
  logger.info({ dir: uploadsDir }, "Created uploads directory");
}

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

// Connect to MongoDB then start listening
connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      logger.info({ port }, "Server listening");
    });

    const shutdown = (signal: string) => {
      logger.info({ signal }, "Shutdown signal received");
      server.close(async () => {
        await disconnectDB();
        logger.info("Server closed");
        process.exit(0);
      });
      setTimeout(() => {
        logger.error("Forced shutdown");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to database");
    process.exit(1);
  });

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});
