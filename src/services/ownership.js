import { Admin } from "../models/Admin.js";

/**
 * The panel owner is the admin with role "owner". Until someone is made owner,
 * the first admin account ever created is treated as the owner, so existing
 * installations need no data change.
 */
export async function findOwner() {
  return (await Admin.findOne({ role: "owner" }).sort({ createdAt: 1 })) || Admin.findOne().sort({ createdAt: 1 });
}

export async function isOwner(admin) {
  if (!admin) return false;
  if (admin.role === "owner") return true;
  const owner = await findOwner();
  return Boolean(owner) && owner._id.equals(admin._id);
}
