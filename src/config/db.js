import dns from "dns";
import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  // Ensure reliable Atlas SRV record resolution across all network providers
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    // Ignore if not permitted
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  const { name } = connection.connection;
  console.log(`[db] MongoDB connected: ${name}`);
  return connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
