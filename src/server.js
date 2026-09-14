import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { redactUri } from "./utils/redactUri.js";

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error(`[db] Could not reach MongoDB at ${redactUri(env.mongoUri)}`);
    console.error(`[db] ${error.message}`);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] Jungle Safari API listening on http://localhost:${env.port}/api`);
    console.log(`[server] Environment: ${env.nodeEnv}`);
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[server] ${signal} received, shutting down`);

    server.close(() => {
      disconnectDatabase().finally(() => process.exit(0));
    });

    // Force exit if open connections keep the server alive.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled promise rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("[server] Uncaught exception:", error);
  process.exit(1);
});

start();
