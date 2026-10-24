import mongoose from "mongoose";

const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true, maxlength: 120 },
    // Optional: the safari desk replies by phone or WhatsApp; email is a bonus.
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
    // Required for new messages by the contact form (older ones may not have one).
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
