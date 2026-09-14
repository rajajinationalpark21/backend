import mongoose from "mongoose";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `Image is too large. The maximum size is ${Math.round(
    env.uploads.maxFileSizeBytes / (1024 * 1024)
  )}MB.`,
  LIMIT_FILE_COUNT: `Too many files. The maximum is ${env.uploads.maxFilesPerRequest} per request.`,
  LIMIT_UNEXPECTED_FILE: "Unexpected file field. Check the form field name.",
  LIMIT_PART_COUNT: "Too many parts in the request.",
  LIMIT_FIELD_KEY: "Form field name is too long.",
  LIMIT_FIELD_VALUE: "Form field value is too long.",
};

function firstValidationMessage(error) {
  const [first] = Object.values(error.errors ?? {});
  return first?.message || "The submitted data is not valid";
}

function isCloudinaryError(error) {
  return error?.http_code !== undefined || error?.error?.http_code !== undefined;
}

export function notFound(req, res, next) {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong on our end";

  if (error instanceof AppError) {
    message = error.message;
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = MULTER_MESSAGES[error.code] ?? `Upload failed: ${error.message}`;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = firstValidationMessage(error);
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value supplied for "${error.path}"`;
  } else if (error?.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(error.keyPattern ?? {}).join(", ") || "value";
    message = `A record with this ${fields} already exists`;
  } else if (isCloudinaryError(error)) {
    statusCode = 502;
    message = "The image storage provider rejected the upload. Please try again.";
  }

  if (statusCode >= 500) {
    if (error instanceof AppError) {
      console.error(`[error] ${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
    } else {
      console.error(`[error] ${req.method} ${req.originalUrl}`, error);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment && statusCode >= 500 ? { stack: error.stack } : {}),
  });
}
