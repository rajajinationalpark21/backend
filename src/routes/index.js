import mongoose from "mongoose";
import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import blogRoutes from "./blog.routes.js";
import galleryRoutes from "./gallery.routes.js";
import contactRoutes from "./contact.routes.js";
import contentRoutes from "./content.routes.js";
import safariRoutes from "./safari.routes.js";
import settingsRoutes from "./settings.routes.js";
import uploadRoutes from "./upload.routes.js";
import feedbackRoutes from "./feedback.routes.js";
import bookingRoutes from "./booking.routes.js";

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

export const apiRouter = Router();

apiRouter.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  let dbLatencyMs = null;

  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.command({ ping: 1 });
      dbLatencyMs = Date.now() - start;
      dbStatus = "connected";
    } catch (err) {
      dbStatus = "error";
    }
  } else {
    dbStatus = DB_STATES[mongoose.connection.readyState] ?? "unknown";
  }

  const isHealthy = dbStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "ok" : "degraded",
    database: dbStatus,
    dbLatencyMs,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use("/admin", adminRoutes);
apiRouter.use("/blogs", blogRoutes);
apiRouter.use("/gallery", galleryRoutes);
apiRouter.use("/contact", contactRoutes);
apiRouter.use("/content", contentRoutes);
apiRouter.use("/safari", safariRoutes);
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/uploads", uploadRoutes);
apiRouter.use("/feedback", feedbackRoutes);
apiRouter.use("/booking", bookingRoutes);
