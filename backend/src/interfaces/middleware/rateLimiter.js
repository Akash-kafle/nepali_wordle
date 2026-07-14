// =============================================================
// Middleware: Rate Limiter (express-rate-limit)
// =============================================================

const rateLimit = require('express-rate-limit');

/**
 * Auth endpoints (register, login): 10 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/**
 * General API: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

/**
 * Email resend: 3 requests per 15 minutes per IP
 */
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      3,
  message:  { error: 'Too many email requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { authLimiter, apiLimiter, emailLimiter };
