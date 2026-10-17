import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One entry per change made through the admin panel: who did it, what they did
 * and to what. Entries are removed automatically after a year.
 */
const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "Admin" },
    actorEmail: { type: String, trim: true, maxlength: 160, default: "" },
    action: { type: String, required: true, trim: true, maxlength: 60 },
    target: { type: String, trim: true, maxlength: 200, default: "" },
    detail: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, trim: true, maxlength: 80, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
