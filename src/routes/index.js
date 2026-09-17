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

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

export const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  const state = DB_STATES[mongoose.connection.readyState] ?? "unknown";
  res.json({
    success: state === "connected",
    status: state === "connected" ? "ok" : "degraded",
    database: state,
    uptime: Math.round(process.uptime()),
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
