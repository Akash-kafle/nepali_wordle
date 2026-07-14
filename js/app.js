// =============================================================
// app.js — Application controller: auth state, routing, views
// =============================================================

const App = (() => {
  // ---- State ----
  let _isLoggedIn  = false;
  let _isVerified  = false;
  let _toastTimer  = null;

  // ---- Init ----
  async function init() {
    _bindNavButtons();
    _bindAuthForms();
    _bindTabSwitchers();
    _bindVerificationButtons();

    // Check for verification token in URL (?verify=TOKEN)
    const urlParams   = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify');

    if (verifyToken) {
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
      await _handleEmailVerification(verifyToken);
      return;
    }

    const token = localStorage.getItem('nwg_token');
    if (token) {
      try {
        const res = await Api.getMe();
        _setLoggedIn(true, res.user?.isVerified ?? true);
      } catch {
        localStorage.removeItem('nwg_token');
        _setLoggedIn(false, false);
      }
    } else {
      _setLoggedIn(false, false);
    }

    // Always init game view
    Game.init();
  }

  // ---- Email verification handler ----
  async function _handleEmailVerification(token) {
    showView('verify');
    const iconEl    = document.getElementById('verify-result-icon');
    const titleEl   = document.getElementById('verify-result-title');
    const msgEl     = document.getElementById('verify-result-message');
    const playBtn   = document.getElementById('verify-go-play-btn');
    const resendBtn = document.getElementById('verify-resend-btn');

    try {
      const result = await Api.verifyEmail(token);

      iconEl.textContent  = '✅';
      titleEl.textContent = 'Email Verified!';
      msgEl.textContent   = result.message || 'Your email has been verified successfully.';
      playBtn.classList.remove('hidden');
      resendBtn.classList.add('hidden');

      playBtn.onclick = () => {
        showView('game');
        // Refresh auth state
        const savedToken = localStorage.getItem('nwg_token');
        if (savedToken) {
          Api.getMe().then(res => {
            _setLoggedIn(true, res.user?.isVerified ?? true);
            Game.init();
          }).catch(() => {
            _setLoggedIn(false, false);
            Game.init();
          });
        } else {
          Game.init();
        }
      };

    } catch (err) {
      iconEl.textContent  = '❌';
      titleEl.textContent = 'Verification Failed';
      msgEl.textContent   = err.message || 'Could not verify your email. The link may be invalid or expired.';
      playBtn.classList.add('hidden');

      // Show resend button if user is logged in
      const savedToken = localStorage.getItem('nwg_token');
      if (savedToken) {
        resendBtn.classList.remove('hidden');
        resendBtn.onclick = async () => {
          resendBtn.disabled = true;
          resendBtn.textContent = 'Sending...';
          try {
            const res = await Api.resendVerification();
            showToast(res.message || 'Verification email sent!');
            resendBtn.textContent = 'Email Sent ✓';
          } catch (e) {
            showToast(e.message || 'Failed to resend');
            resendBtn.textContent = 'Resend Verification Email';
            resendBtn.disabled = false;
          }
        };
      }
    }
  }

  // ---- Auth state ----
  function _setLoggedIn(val, verified) {
    _isLoggedIn = val;
    _isVerified = verified ?? false;

    const authBtn      = document.getElementById('nav-auth-btn');
    const logoutBtn    = document.getElementById('nav-logout-btn');
    const streakBar    = document.getElementById('streak-bar');
    const verifyBanner = document.getElementById('verify-banner');

    if (val) {
      authBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');

      // Remove guest banner if present
      const banner = document.querySelector('.guest-banner');
      if (banner) banner.remove();

      if (verified) {
        streakBar.classList.remove('hidden');
        if (verifyBanner) verifyBanner.classList.add('hidden');
      } else {
        streakBar.classList.add('hidden');
        if (verifyBanner) verifyBanner.classList.remove('hidden');
      }
    } else {
      authBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      if (verifyBanner) verifyBanner.classList.add('hidden');

      // Show guest banner
      _showGuestBanner();
    }
  }

  function _showGuestBanner() {
    const container = document.querySelector('.game-container');
    if (!container || document.querySelector('.guest-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'guest-banner';
    banner.innerHTML = `
      <strong>Playing as guest.</strong>
      <button class="link-btn" id="guest-signin-btn">Sign in</button> to save your streak & join the leaderboard.
    `;
    container.insertBefore(banner, container.firstChild);

    document.getElementById('guest-signin-btn').addEventListener('click', () => {
      showView('auth');
    });
  }

  // ---- Verification banner buttons ----
  function _bindVerificationButtons() {
    const resendBtn = document.getElementById('resend-verify-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        resendBtn.disabled    = true;
        resendBtn.textContent = 'Sending...';
        try {
          const res = await Api.resendVerification();
          showToast(res.message || 'Verification email sent! 📧');
          resendBtn.textContent = 'Sent ✓';
          setTimeout(() => {
            resendBtn.textContent = 'Resend Email';
            resendBtn.disabled    = false;
          }, 30000);
        } catch (err) {
          showToast(err.message || 'Failed to send');
          resendBtn.textContent = 'Resend Email';
          resendBtn.disabled    = false;
        }
      });
    }
  }

  // ---- Navigation buttons ----
  function _bindNavButtons() {
    document.getElementById('nav-auth-btn').addEventListener('click', () => showView('auth'));
    document.getElementById('nav-logout-btn').addEventListener('click', _logout);
    document.getElementById('nav-stats-btn').addEventListener('click', () => {
      Stats.showStatsModal();
    });
    document.getElementById('nav-leaderboard-btn').addEventListener('click', () => {
      showView('leaderboard');
      Stats.loadLeaderboard();
    });
    const modeBtn = document.getElementById('nav-game-mode-btn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        const isPractice = Game.isPracticeMode();
        Game.setPracticeMode(!isPractice);
      });
    }
  }

  // ---- Auth forms ----
  function _bindAuthForms() {
    // Login form
    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn     = document.getElementById('login-submit-btn');
      const errEl   = document.getElementById('login-error');
      const email   = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      errEl.classList.add('hidden');
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled  = true;

      try {
        const res = await Api.login({ email, password });
        localStorage.setItem('nwg_token', res.token);
        const verified = res.user?.isVerified ?? false;
        _setLoggedIn(true, verified);
        showView('game');
        if (verified) {
          showToast('Welcome back! 👋');
        } else {
          showToast('Please verify your email to play daily challenges.');
        }
        Game.reset();
      } catch (err) {
        errEl.textContent = err.message || 'Login failed';
        errEl.classList.remove('hidden');
      } finally {
        btn.textContent = 'Sign In';
        btn.disabled    = false;
      }
    });

    // Register form
    document.getElementById('form-register').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn      = document.getElementById('register-submit-btn');
      const errEl    = document.getElementById('register-error');
      const username = document.getElementById('reg-username').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      errEl.classList.add('hidden');
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled  = true;

      try {
        const res = await Api.register({ email, password, username });
        localStorage.setItem('nwg_token', res.token);
        _setLoggedIn(true, false); // Not verified yet
        showView('game');
        showToast(res.message || 'Account created! Check your email to verify. 📧');
        Game.reset();
      } catch (err) {
        errEl.textContent = err.message || 'Registration failed';
        errEl.classList.remove('hidden');
      } finally {
        btn.textContent = 'Create Account';
        btn.disabled    = false;
      }
    });
  }

  function _bindTabSwitchers() {
    const tabLogin    = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const panelLogin  = document.getElementById('panel-login');
    const panelReg    = document.getElementById('panel-register');

    function switchToLogin() {
      tabLogin.classList.add('active');    tabLogin.setAttribute('aria-selected', 'true');
      tabRegister.classList.remove('active'); tabRegister.setAttribute('aria-selected', 'false');
      panelLogin.classList.remove('hidden');
      panelReg.classList.add('hidden');
    }

    function switchToRegister() {
      tabRegister.classList.add('active');  tabRegister.setAttribute('aria-selected', 'true');
      tabLogin.classList.remove('active');  tabLogin.setAttribute('aria-selected', 'false');
      panelReg.classList.remove('hidden');
      panelLogin.classList.add('hidden');
    }

    tabLogin.addEventListener('click', switchToLogin);
    tabRegister.addEventListener('click', switchToRegister);
    document.getElementById('switch-to-register').addEventListener('click', switchToRegister);
    document.getElementById('switch-to-login').addEventListener('click', switchToLogin);
  }

  function _logout() {
    localStorage.removeItem('nwg_token');
    _setLoggedIn(false, false);
    showView('game');
    showToast('Signed out 👋');
    Game.reset();
  }

  // ---- View routing ----
  function showView(name) {
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('view--active');
      v.style.display = 'none';
    });
    const target = document.getElementById(`view-${name}`);
    if (target) {
      target.style.display = 'flex';
      target.classList.add('view--active');
    }
  }

  // ---- Toast notifications ----
  function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  // ---- Getters ----
  function isVerified() { return _isVerified; }
  function isLoggedIn() { return _isLoggedIn; }

  // ---- Start ----
  document.addEventListener('DOMContentLoaded', init);

  return { showView, showToast, isVerified, isLoggedIn };
})();
