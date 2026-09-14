import mongoose from "mongoose";

const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    subject: { type: String, trim: true, maxlength: 160, default: "" },
    message: {
      type: String,
      required: [true, "message is required"],
      trim: true,
      maxlength: 4000,
    },
  },
  { timestamps: true }
);

contactSchema.index({ createdAt: -1 });

export const Contact = mongoose.model("Contact", contactSchema);
