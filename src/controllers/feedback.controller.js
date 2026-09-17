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
    status: "pending",
    isVerified: false,
  });

  res.status(201).json({
    success: true,
    message: "Thank you for sharing your experience! Your review will appear after moderator approval.",
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

/** Admin endpoint to retrieve all feedback items (both approved and pending) */
export const adminListFeedback = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status && ["approved", "pending"].includes(req.query.status)) {
    query.status = req.query.status;
  }
  if (req.query.zone && req.query.zone !== "All") {
    query.zone = req.query.zone;
  }
  if (req.query.rating) {
    const ratingNum = Number(req.query.rating);
    if (!isNaN(ratingNum)) query.rating = ratingNum;
  }

  const feedbacks = await Feedback.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    count: feedbacks.length,
    feedbacks,
  });
});

/** Admin endpoint to update feedback status (approved/pending) or verification flag */
export const updateFeedback = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, FEEDBACK_ID_ALIASES, "feedbackId");
  
  const updates = {};
  if (req.body.status && ["approved", "pending"].includes(req.body.status)) {
    updates.status = req.body.status;
  }
  if (typeof req.body.isVerified === "boolean") {
    updates.isVerified = req.body.isVerified;
  }
  if (req.body.name) updates.name = String(req.body.name).trim();
  if (req.body.comment) updates.comment = String(req.body.comment).trim();
  if (req.body.zone) updates.zone = String(req.body.zone).trim();
  if (req.body.rating) {
    const r = Number(req.body.rating);
    if (!isNaN(r) && r >= 1 && r <= 5) updates.rating = r;
  }

  const feedback = await Feedback.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!feedback) throw new AppError("Feedback not found", 404);

  res.json({
    success: true,
    message: "Feedback updated successfully",
    feedback,
  });
});

/** Admin endpoint to delete feedback */
export const deleteFeedback = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, FEEDBACK_ID_ALIASES, "feedbackId");
  const feedback = await Feedback.findByIdAndDelete(id);

  if (!feedback) throw new AppError("Feedback not found", 404);

  res.json({ success: true, message: "Feedback deleted successfully" });
});

