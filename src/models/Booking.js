import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    zone: { type: String, required: true, trim: true, maxlength: 100 },
    date: { type: String, required: true, trim: true, maxlength: 30 },
    shift: { type: String, required: true, trim: true, maxlength: 80 },
    guests: { type: Number, min: 1, max: 50, default: 2 },
    specialRequests: { type: String, trim: true, maxlength: 500, default: "" },
    refNumber: { type: String, trim: true, maxlength: 30, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "confirmed", "cancelled"],
      default: "new",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });

export const Booking = mongoose.model("Booking", bookingSchema);
