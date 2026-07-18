// =============================================================
// config.js — Frontend global runtime configuration
// =============================================================

window.CONFIG = {
  // For production deployment (e.g. GitHub Pages + Railway):
  // This placeholder will be replaced with your actual Railway backend URL
  // by GitHub Actions during deployment using the API_BASE variable.
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : '__API_BASE__'
};

