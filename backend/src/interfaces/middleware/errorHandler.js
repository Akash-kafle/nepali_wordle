// =============================================================
// Middleware: Global Error Handler
// Structured error responses with codes
// =============================================================

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message    = statusCode < 500 ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  const response = { error: message };

  // Include error code if provided (e.g., EMAIL_NOT_VERIFIED)
  if (err.code) {
    response.code = err.code;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
