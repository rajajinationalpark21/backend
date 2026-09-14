import mongoose from "mongoose";

const { Schema } = mongoose;

const adminSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120, default: "Administrator" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin"], default: "admin" },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

/** Shape sent back to the admin panel. Never includes passwordHash. */
adminSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
  };
};

export const Admin = mongoose.model("Admin", adminSchema);
