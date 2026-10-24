import { AuditLog } from "../models/AuditLog.js";

/**
 * Records an admin action. Never throws: a failed log write must not fail the
 * change the admin just made.
 *
 *   recordAudit(req, "blog.delete", blog.title)
 *   recordAudit(req, "content.update", "tickets", { fields: ["title", "docBlocks"] })
 */
export async function recordAudit(req, action, target = "", detail = {}, actor = req.admin) {
  try {
    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || "",
      action,
      target: String(target ?? "").slice(0, 200),
      detail,
      ip: String(req.ip || "").slice(0, 80),
      userAgent: String(req.get?.("user-agent") || "").slice(0, 300),
    });
  } catch (error) {
    console.warn(`[audit] Could not record ${action}: ${error.message}`);
  }
}
