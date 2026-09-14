import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { AppError } from "./utils/AppError.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { apiRouter } from "./routes/index.js";

function buildCorsOptions() {
  const { corsOrigins } = env;

  // "*" (development with no allowlist configured): reflect whatever origin asked.
  if (corsOrigins === "*") return { origin: true, credentials: true };

  // null (production with no allowlist configured): block cross-origin requests.
  if (corsOrigins === null) return { origin: false };

  return {
    credentials: true,
    origin(origin, callback) {
      // Same-origin and non-browser clients send no Origin header.
      if (!origin || corsOrigins.includes(origin) || corsOrigins.includes("*")) return callback(null, true);
      return callback(new AppError(`Origin "${origin}" is not allowed by CORS`, 403));
    },
  };
}

export function createApp() {
  const app = express();

  // The API sits behind a reverse proxy in production, which is required for
  // rate limiting to see real client addresses.
  if (env.isProduction) app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  if (env.isDevelopment) app.use(morgan("dev"));

  app.get("/", (req, res) => {
    res.json({
      success: true,
      name: "Jungle Safari API",
      docs: "/api/health",
    });
  });

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
