import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin.js";
import { AuditLog } from "../models/AuditLog.js";
import { signToken } from "../middleware/auth.js";
import { recordAudit } from "../services/audit.js";
import { findOwner, isOwner } from "../services/ownership.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getEmail, getObjectId, getString } from "../utils/validation.js";

// Compared against when the email is unknown so response timing does not reveal
// which addresses are registered.
const DECOY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export const MIN_PASSWORD_LENGTH = 8;

export const login = asyncHandler(async (req, res) => {
  const email = getEmail(req.body, "email");
  const password = getString(req.body, "password", { required: true, max: 200 });
  const role = getString(req.body, "role", { max: 20, fallback: "admin" });

  if (role !== "admin") {
    throw new AppError("This sign-in is restricted to administrators", 403);
  }

  const admin = await Admin.findOne({ email }).select("+passwordHash");
  const passwordMatches = await bcrypt.compare(password, admin?.passwordHash ?? DECOY_HASH);

  if (!admin || !passwordMatches) {
    throw new AppError("Incorrect email or password", 401);
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  res.json({
    success: true,
    message: "Signed in successfully",
    token: signToken(admin),
    admin: { ...admin.toPublicJSON(), isOwner: await isOwner(admin) },
  });
});

/** The signed-in admin, so the panel knows whether to show owner-only tools. */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: { ...req.admin.toPublicJSON(), isOwner: await isOwner(req.admin) } });
});

/**
 * `findByIdAndUpdate` rather than `save()`: `req.admin` was loaded without the
 * `select: false` password hash, and validating that partial document would trip
 * its required rule.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) {
    updates.name = getString(req.body, "name", { required: true, max: 120 });
  }
  if (req.body.email !== undefined) {
    updates.email = getEmail(req.body, "email");
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('Nothing to update. Send "name" and/or "email".', 400);
  }

  const admin = await Admin.findByIdAndUpdate(req.admin._id, { $set: updates }, {
    new: true,
    runValidators: true,
  });

  await recordAudit(req, "admin.profile", admin.email, { fields: Object.keys(updates) });
  res.json({ success: true, message: "Profile updated", admin: admin.toPublicJSON() });
});

/** List all admin users (no password hashes). */
export const listUsers = asyncHandler(async (req, res) => {
  const admins = await Admin.find().sort({ createdAt: -1 }).lean();
  const owner = await findOwner();
  const safe = admins.map(({ passwordHash, ...rest }) => ({
    ...rest,
    isOwner: Boolean(owner) && owner._id.equals(rest._id),
  }));
  res.json({ success: true, count: safe.length, admins: safe, canManage: await isOwner(req.admin) });
});

/** Create a new admin user. */
export const createUser = asyncHandler(async (req, res) => {
  const name = getString(req.body, "name", { required: true, max: 120 });
  const email = getEmail(req.body, "email");
  const password = getString(req.body, "password", { required: true, max: 200 });

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }

  const exists = await Admin.findOne({ email });
  if (exists) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ name, email, passwordHash });
  await recordAudit(req, "admin.create", email);

  res.status(201).json({
    success: true,
    message: "Admin user created",
    admin: admin.toPublicJSON(),
  });
});

/** Delete an admin user. Cannot delete yourself. */
export const deleteUser = asyncHandler(async (req, res) => {
  const id = getString(req.body, "userId", { required: true });
  if (id === req.admin._id.toString()) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const target = await Admin.findById(id);
  if (!target) throw new AppError("Admin user not found", 404);
  if (await isOwner(target)) {
    throw new AppError("The owner account cannot be deleted. Transfer ownership first.", 400);
  }

  await target.deleteOne();
  await recordAudit(req, "admin.delete", target.email);

  res.json({ success: true, message: "Admin user deleted" });
});

/** The owner hands the owner role to another admin and becomes a regular admin. */
export const transferOwnership = asyncHandler(async (req, res) => {
  const id = getObjectId(req.body, "userId");
  if (id === req.admin._id.toString()) {
    throw new AppError("You already own the panel", 400);
  }
  const target = await Admin.findById(id);
  if (!target) throw new AppError("Admin user not found", 404);

  await Admin.updateMany({ role: "owner" }, { $set: { role: "admin" } });
  await Admin.updateOne({ _id: target._id }, { $set: { role: "owner" } });
  await recordAudit(req, "admin.transfer-ownership", target.email);

  res.json({ success: true, message: `${target.email} now owns the admin panel` });
});

/** Recent admin actions, newest first (owner only). */
export const listAuditLog = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const entries = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ success: true, count: entries.length, entries });
});

export const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = getString(req.body, "currentPassword", { required: true, max: 200 });
  const newPassword = getString(req.body, "newPassword", { required: true, max: 200 });

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }
  if (newPassword === currentPassword) {
    throw new AppError("New password must be different from the current one", 400);
  }

  const admin = await Admin.findById(req.admin._id).select("+passwordHash");
  if (!admin) throw new AppError("Account no longer exists", 401);

  const currentPasswordMatches = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!currentPasswordMatches) {
    throw new AppError("Current password is incorrect", 401);
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  admin.passwordChangedAt = new Date();
  await admin.save();
  await recordAudit(req, "admin.password", admin.email);

  res.json({
    success: true,
    message: "Password changed. Other signed-in devices will need to sign in again.",
  });
});
