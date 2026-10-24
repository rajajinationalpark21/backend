import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One page view on the public website. No cookies and no personal data:
 * `visitor` is a one-way hash of the address and browser that changes every day,
 * so a person can be counted once per day but never identified or followed.
 */
const pageViewSchema = new Schema(
  {
    path: { type: String, trim: true, maxlength: 200, required: true },
    source: { type: String, trim: true, maxlength: 40, default: "direct" },
    referrerHost: { type: String, trim: true, maxlength: 120, default: "" },
    device: { type: String, enum: ["mobile", "tablet", "desktop"], default: "desktop" },
    visitor: { type: String, maxlength: 64, default: "" },
    // The browser's first page view ever on the site (it remembers that itself).
    firstVisit: { type: Boolean, default: false },
    day: { type: String, maxlength: 10, required: true }, // YYYY-MM-DD, India time
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
pageViewSchema.index({ day: 1 });

export const PageView = mongoose.models.PageView || mongoose.model("PageView", pageViewSchema);
