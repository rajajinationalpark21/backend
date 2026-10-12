import { Router } from "express";
import {
  submitBooking,
  listBookings,
  updateBooking,
  deleteBooking,
} from "../controllers/booking.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { bookingLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Public: submit a booking inquiry
router.post("/submit", bookingLimiter, submitBooking);

// Admin: list, update status, delete
router.get("/get", requireAdmin, listBookings);
router.patch("/update", requireAdmin, updateBooking);
router.delete("/delete", requireAdmin, deleteBooking);

export default router;
