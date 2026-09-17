import { Feedback } from "../models/Feedback.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getString, getIdFromAliases } from "../utils/validation.js";

const FEEDBACK_ID_ALIASES = ["feedbackId", "id", "_id"];

/** Public endpoint to submit visitor feedback / reviews */
export const submitFeedback = asyncHandler(async (req, res) => {
  const name = getString(req.body, "name", { required: true, max: 120 });
  const comment = getString(req.body, "comment", { required: true, max: 2000 });
  const zone = getString(req.body, "zone", { max: 100, fallback: "Chilla Range" });
  const location = getString(req.body, "location", { max: 100, fallback: "Guest Visitor" });
  const visitDate = getString(req.body, "visitDate", { max: 60, fallback: "Recent Visit" });

  let rating = Number(req.body.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    rating = 5;
  }

  const feedback = await Feedback.create({
    name,
    comment,
    rating,
    zone,
    location,
    visitDate,
    status: "approved",
    isVerified: true,
  });

  res.status(201).json({
    success: true,
    message: "Thank you for sharing your experience! Your feedback has been published.",
    feedback,
  });
});

/** Public endpoint to retrieve approved feedback */
export const listFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({
    success: true,
    count: feedbacks.length,
    feedbacks,
  });
});

/** Admin endpoint to delete feedback */
export const deleteFeedback = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, FEEDBACK_ID_ALIASES, "feedbackId");
  const feedback = await Feedback.findByIdAndDelete(id);

  if (!feedback) throw new AppError("Feedback not found", 404);

  res.json({ success: true, message: "Feedback deleted successfully" });
});
