import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });

const isProduction = process.env.NODE_ENV === "production";

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (isProduction) {
    throw new Error("JWT_SECRET must be set when NODE_ENV=production");
  }
  console.warn(
    "[env] JWT_SECRET is not set - using a temporary secret for this run. " +
      "Admin sessions will be invalidated on every restart."
  );
  return crypto.randomBytes(32).toString("hex");
}

function resolveOrigins() {
  const configured = (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) return configured;
  // No explicit allowlist: permit any origin in development, deny cross-origin
  // requests entirely in production rather than defaulting to wide open.
  return isProduction ? null : "*";
}

const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 5;

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  isDevelopment: !isProduction,
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017/jungle_safari",
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "7d",
  corsOrigins: resolveOrigins(),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || "",
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || "",
    folder: process.env.CLOUDINARY_FOLDER?.trim() || "jungle-safari",
  },
  seedAdmin: {
    name: process.env.ADMIN_NAME?.trim() || "Administrator",
    email: process.env.ADMIN_EMAIL?.trim() || "admin@junglesafari.com",
    password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
  },
  uploads: {
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    maxFilesPerRequest: Number(process.env.MAX_FILES_PER_REQUEST) || 12,
  },
};

export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
