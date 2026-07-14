// =============================================================
// config.js — Frontend global runtime configuration
// =============================================================

window.CONFIG = {
  // For production deployment (e.g. GitHub Pages + Railway):
  // Replace the placeholder below with your actual Railway backend URL.
  // Example: 'https://nepali-word-game-production.up.railway.app/api'
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : 'https://YOUR-RAILWAY-BACKEND-URL.up.railway.app/api'
};

