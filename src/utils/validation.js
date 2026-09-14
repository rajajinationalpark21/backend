import mongoose from "mongoose";
import { AppError } from "./AppError.js";

/**
 * Reads a string field from a request body.
 *
 * The `typeof` guard is deliberate: it rejects objects such as `{ "$gt": "" }`
 * before they can reach a Mongo query.
 */
export function getString(source, field, { required = false, max = 2000, fallback = "" } = {}) {
  const value = source?.[field];

  if (value === undefined || value === null || value === "") {
    if (required) throw new AppError(`"${field}" is required`, 400);
    return fallback;
  }

  if (typeof value !== "string") {
    throw new AppError(`"${field}" must be a string`, 400);
  }

  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new AppError(`"${field}" must be ${max} characters or fewer`, 400);
  }
  if (required && trimmed === "") {
    throw new AppError(`"${field}" is required`, 400);
  }

  return trimmed;
}

export function getEmail(source, field = "email", { required = true } = {}) {
  const value = getString(source, field, { required, max: 160 });
  if (!value) return "";

  const normalized = value.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
    throw new AppError(`"${field}" must be a valid email address`, 400);
  }
  return normalized;
}

/** Parses an id coming from a URL param or a request body. */
export function getObjectId(source, field, { required = true } = {}) {
  const raw = source?.[field];

  if (raw === undefined || raw === null || raw === "") {
    if (required) throw new AppError(`"${field}" is required`, 400);
    return null;
  }
  if (typeof raw !== "string" || !mongoose.isValidObjectId(raw)) {
    throw new AppError(`"${field}" must be a valid id`, 400);
  }
  return raw;
}

export function getBoolean(source, field, fallback = true) {
  const value = source?.[field];
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new AppError(`"${field}" must be a boolean`, 400);
}

/** Accepts the several id names the admin panel uses for the same record. */
export function getIdFromAliases(source, aliases, label) {
  for (const alias of aliases) {
    if (source?.[alias] !== undefined && source?.[alias] !== null && source?.[alias] !== "") {
      return getObjectId(source, alias);
    }
  }
  throw new AppError(`"${label}" is required`, 400);
}
