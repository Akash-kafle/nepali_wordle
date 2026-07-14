// =============================================================
// Middleware: Input Sanitizer
// Trims strings and strips HTML from request bodies
// =============================================================

/**
 * Recursively sanitize an object's string values:
 * - Trim whitespace
 * - Strip HTML tags
 */
function sanitizeValue(val) {
  if (typeof val === 'string') {
    return val.trim().replace(/<[^>]*>/g, '');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val && typeof val === 'object') {
    const sanitized = {};
    for (const key of Object.keys(val)) {
      sanitized[key] = sanitizeValue(val[key]);
    }
    return sanitized;
  }
  return val;
}

/**
 * Express middleware that sanitizes req.body
 */
function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}

module.exports = inputSanitizer;
