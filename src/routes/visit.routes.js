import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import { recordVisit } from "../controllers/visit.controller.js";

const router = Router();

// Generous for real browsing, but stops a script from flooding the counter.
const visitLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false });

router.post("/", visitLimiter, express.text({ type: "text/plain", limit: "2kb" }), recordVisit);

export default router;
