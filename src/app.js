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

  return {
    credentials: true,
    origin(origin, callback) {
      // Same-origin and non-browser clients send no Origin header.
      if (!origin) return callback(null, true);

      // If corsOrigins is "*" or includes "*", permit all origins with credentials reflection
      if (
        corsOrigins === "*" ||
        !corsOrigins ||
        (Array.isArray(corsOrigins) && (corsOrigins.includes("*") || corsOrigins.length === 0))
      ) {
        return callback(null, true);
      }

      // Check allowlist
      if (Array.isArray(corsOrigins)) {
        const matched = corsOrigins.some((allowed) => {
          if (allowed === origin) return true;
          if (allowed.startsWith("*.")) {
            return origin.endsWith(allowed.slice(2));
          }
          return false;
        });
        if (matched) return callback(null, true);
      }

      // Automatically permit standard deployment platforms
      if (
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".onrender.com") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }

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

  const corsOptions = buildCorsOptions();
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(helmet());
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
