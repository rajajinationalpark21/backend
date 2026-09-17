import mongoose from "mongoose";

const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true, 
      maxlength: 120 
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: "",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
      default: 5,
    },
    zone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Chilla Range",
    },
    comment: {
      type: String,
      required: [true, "Feedback comment is required"],
      trim: true,
      maxlength: 2000,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "India",
    },
    visitDate: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["approved", "pending"],
      default: "approved",
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });

export const Feedback = mongoose.model("Feedback", feedbackSchema);
