import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
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
