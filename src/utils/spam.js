/**
 * The public forms carry a hidden "website_hp" field that people never see.
 * Bots that fill in every field fill it in too; their submissions get a normal
 * looking success response but are not stored.
 */
export const HONEYPOT_FIELD = "website_hp";

export function isHoneypotFilled(body) {
  const value = body?.[HONEYPOT_FIELD];
  if (value === undefined || value === null) return false;
  return typeof value !== "string" || value.trim() !== "";
}

export function logTrappedSubmission(req, form) {
  console.warn(`[spam] ${form} submission dropped (honeypot filled) from ${req.ip}`);
}
