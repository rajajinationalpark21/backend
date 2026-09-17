import bcrypt from "bcryptjs";
import { Admin } from "../models/Admin.js";
import { signToken } from "../middleware/auth.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getEmail, getString } from "../utils/validation.js";

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
    admin: admin.toPublicJSON(),
  });
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

  res.json({ success: true, message: "Profile updated", admin: admin.toPublicJSON() });
});

/** List all admin users (no password hashes). */
export const listUsers = asyncHandler(async (req, res) => {
  const admins = await Admin.find().sort({ createdAt: -1 }).lean();
  const safe = admins.map(({ passwordHash, ...rest }) => rest);
  res.json({ success: true, count: safe.length, admins: safe });
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

  const admin = await Admin.findByIdAndDelete(id);
  if (!admin) throw new AppError("Admin user not found", 404);

  res.json({ success: true, message: "Admin user deleted" });
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

  res.json({
    success: true,
    message: "Password changed. Other signed-in devices will need to sign in again.",
  });
});
