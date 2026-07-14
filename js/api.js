// =============================================================
// api.js — Fetch wrapper with JWT auth
// =============================================================

const API_BASE = window.CONFIG?.API_BASE || '/api';

const Api = (() => {
  function _getToken() {
    return localStorage.getItem('nwg_token');
  }

  async function _request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = _getToken();

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.code   = data.code || null;
      throw err;
    }

    return data;
  }

  return {
    // Auth
    register: (body) => _request('POST', '/auth/register', body),
    login:    (body) => _request('POST', '/auth/login', body),
    getMe:    ()     => _request('GET',  '/auth/me'),

    // Email verification
    verifyEmail:        (token) => _request('GET', `/auth/verify?token=${encodeURIComponent(token)}`),
    resendVerification: ()      => _request('POST', '/auth/resend-verification'),

    // Game
    getDaily:    () => _request('GET',  '/game/daily'),
    getPractice: () => _request('GET',  '/game/practice'),
    submitGuess: (guessText, practiceToken, attemptNumber) => _request('POST', '/game/guess', { guessText, practiceToken, attemptNumber }),

    // Stats & Leaderboard
    getStats:       ()      => _request('GET', '/stats'),
    getLeaderboard: (limit) => _request('GET', `/leaderboard?limit=${limit || 20}`),
  };
})();
