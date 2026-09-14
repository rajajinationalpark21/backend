import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/Admin.js";

export function signToken(admin) {
  return jwt.sign({ role: admin.role, email: admin.email }, env.jwtSecret, {
    subject: admin._id.toString(),
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Guards every mutating admin endpoint. The admin panel attaches the token as
 * `Authorization: Bearer <adminToken>` through its axios interceptor.
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authentication required", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    const reason =
      error.name === "TokenExpiredError"
        ? "Session expired, please sign in again"
        : "Invalid authentication token";
    throw new AppError(reason, 401);
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin) {
    throw new AppError("Account no longer exists", 401);
  }

  // Tokens issued before the last password change are no longer trustworthy.
  // Floored to whole seconds because the JWT `iat` claim has second precision.
  if (admin.passwordChangedAt) {
    const changedAt = Math.floor(admin.passwordChangedAt.getTime() / 1000);
    if ((payload.iat ?? 0) < changedAt) {
      throw new AppError("Password was changed, please sign in again", 401);
    }
  }

  req.admin = admin;
  next();
});
