import rateLimit from "express-rate-limit";

/** Throttles password guessing against the admin sign-in. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Please try again in 15 minutes.",
  },
});

/** Keeps the public contact form from being used as a spam relay. */
export const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent from this address. Please try again in a few minutes.",
  },
});
