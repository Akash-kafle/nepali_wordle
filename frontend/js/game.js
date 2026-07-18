// =============================================================
// game.js — Tile grid, input handling, guess submission
// =============================================================

const Game = (() => {
  const MAX_ROWS    = 6;
  const WORD_LENGTH = 3;

  let _state = {
    currentRow:    0,
    currentInput:  [],   // array of akshara strings, max 3
    tiles:         [],   // 2D array [row][col] of DOM elements
    isGameOver:    false,
    challengeId:   null,
    isPracticeMode: false,
    practiceToken:  null,
  };

  // ---- Public: Initialize ----
  async function init() {
    _buildGrid();
    Keyboard.init(_onKey);

    await _loadDailyChallenge();
  }

  function _buildGrid() {
    const grid = document.getElementById('tile-grid');
    grid.innerHTML = '';
    _state.tiles = [];

    for (let r = 0; r < MAX_ROWS; r++) {
      const row = [];
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = document.createElement('div');
        tile.className  = 'tile';
        tile.id         = `tile-r${r}-c${c}`;
        tile.setAttribute('role', 'gridcell');
        tile.setAttribute('aria-label', `Row ${r+1} column ${c+1}`);
        // Inner div for 3D flip
        const inner = document.createElement('div');
        inner.className = 'tile-inner';
        tile.appendChild(inner);
        grid.appendChild(tile);
        row.push(tile);
      }
      _state.tiles.push(row);
    }
  }

  async function _loadDailyChallenge() {
    try {
      const data = await Api.getDaily();
      _state.challengeId = data.challengeId;

      // Replay existing attempts
      if (data.attempts && data.attempts.length > 0) {
        data.attempts.forEach((attempt, rowIdx) => {
          _renderCompletedRow(rowIdx, tokenize(attempt.guessText), attempt.feedback);
        });
        _state.currentRow = data.attempts.length;
      }

      // Mark current row as active
      _markCurrentRow();

      if (data.gameOver) {
        _endGame(data.won, data.word, data);
      } else {
        // Update streak display
        _updateStreakDisplay();
      }
    } catch (err) {
      _showMessage(err.message || 'Failed to load today\'s challenge');
    }
  }

  // ---- Key handler ----
  function _onKey(event) {
    if (_state.isGameOver) return;

    const isLoggedIn = !!localStorage.getItem('nwg_token');

    if (!_state.isPracticeMode && !isLoggedIn) {
      _showMessage('Sign in to play! Your streak awaits 🔥');
      return;
    }

    // Check if user is verified for daily mode
    if (!_state.isPracticeMode && isLoggedIn && typeof App !== 'undefined' && !App.isVerified()) {
      _showMessage('Please verify your email to play daily challenges. Check your inbox! ✉️');
      return;
    }

    if (event.type === 'char') {
      _addChar(event.value);
    } else if (event.type === 'backspace') {
      _removeChar();
    } else if (event.type === 'enter') {
      _submitGuess();
    }
  }

  function _addChar(char) {
    const COMBINING_REGEX = /^[\u0900-\u0903\u093C\u093E-\u094D\u0951-\u0957]$/;
    const isCombining = COMBINING_REGEX.test(char);

    if (isCombining) {
      // Append combining marks to the last entered base character
      if (_state.currentInput.length > 0) {
        _state.currentInput[_state.currentInput.length - 1] += char;
        _updateCurrentRowDisplay();
      }
      return;
    }

    // Check if the last unit ends with a halant/virama (U+094D) to join the next consonant
    if (_state.currentInput.length > 0) {
      const lastIndex = _state.currentInput.length - 1;
      const lastUnit  = _state.currentInput[lastIndex];
      if (lastUnit.endsWith('\u094D')) {
        _state.currentInput[lastIndex] += char;
        _updateCurrentRowDisplay();
        return;
      }
    }

    // Push as a new base character unit
    if (_state.currentInput.length < WORD_LENGTH) {
      _state.currentInput.push(char);
      _updateCurrentRowDisplay();
    }
  }

  function _removeChar() {
    if (_state.currentInput.length === 0) return;

    const lastIndex = _state.currentInput.length - 1;
    const lastUnit  = _state.currentInput[lastIndex];
    const codePoints = [...lastUnit];

    if (codePoints.length > 1) {
      // Remove only the last typed character/combining mark from the active tile
      codePoints.pop();
      _state.currentInput[lastIndex] = codePoints.join('');
    } else {
      // Remove the entire single character tile
      _state.currentInput.pop();
    }

    _updateCurrentRowDisplay();
  }

  function _updateCurrentRowDisplay() {
    const row = _state.tiles[_state.currentRow];
    if (!row) return;

    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile  = row[c];
      const inner = tile.querySelector('.tile-inner');
      const val   = _state.currentInput[c] || '';

      inner.textContent = val;
      tile.classList.toggle('tile--filled', val.length > 0);
      tile.classList.toggle('tile--current-row', true);
    }
  }

  function _markCurrentRow() {
    for (let c = 0; c < WORD_LENGTH; c++) {
      _state.tiles[_state.currentRow]?.[c]?.classList.add('tile--current-row');
    }
  }

  function _clearCurrentRowHighlight() {
    for (let c = 0; c < WORD_LENGTH; c++) {
      _state.tiles[_state.currentRow]?.[c]?.classList.remove('tile--current-row');
    }
  }

  // ---- Submit guess ----
  async function _submitGuess() {
    if (_state.currentInput.length !== WORD_LENGTH) {
      _shakeCurrentRow();
      _showMessage(`Enter all ${WORD_LENGTH} units`);
      return;
    }

    const guessText = _state.currentInput.join('');

    // Optimistic: disable input
    _state.isGameOver = true;

    try {
      const attemptNum = _state.currentRow + 1;
      const result = await Api.submitGuess(guessText, _state.practiceToken, attemptNum);

      // Animate tiles with feedback
      await _animateRow(_state.currentRow, _state.currentInput, result.feedback);

      // Update keyboard colors
      Keyboard.updateColors(result.feedback);

      _clearCurrentRowHighlight();
      _state.currentRow++;
      _state.currentInput = [];

      if (result.gameOver) {
        _endGame(result.won, result.word, result);
      } else {
        _state.isGameOver = false;
        _markCurrentRow();
        _showMessage('');
        if (!_state.isPracticeMode) {
          _updateStreakDisplay();
        }
      }
    } catch (err) {
      _state.isGameOver = false;
      _shakeCurrentRow();
      _showMessage(err.message || 'Submission failed. Try again.');
    }
  }

  // ---- Render a completed row (from history) ----
  function _renderCompletedRow(rowIdx, units, feedback) {
    const row = _state.tiles[rowIdx];
    if (!row) return;

    feedback.forEach((fb, c) => {
      const tile  = row[c];
      const inner = tile.querySelector('.tile-inner');
      inner.textContent = fb.unit || units[c] || '';
      tile.classList.remove('tile--current-row');
      tile.classList.add('tile--filled', `tile--${fb.status}`);
    });
  }

  // ---- Animate row with flip + color ----
  async function _animateRow(rowIdx, units, feedback) {
    const row = _state.tiles[rowIdx];
    const FLIP_DELAY   = 120;   // ms between each tile
    const FLIP_DURATION = 500;  // ms

    for (let c = 0; c < WORD_LENGTH; c++) {
      await new Promise(resolve => setTimeout(resolve, c * FLIP_DELAY));

      const tile  = row[c];
      const inner = tile.querySelector('.tile-inner');
      inner.textContent = units[c];

      tile.classList.add('tile--flipping');

      // Apply color at mid-flip (250ms in)
      setTimeout(() => {
        tile.classList.remove('tile--flipping', 'tile--filled', 'tile--current-row');
        tile.classList.add(`tile--${feedback[c].status}`);
      }, FLIP_DURATION / 2);

      setTimeout(() => {
        tile.classList.remove('tile--flipping');
      }, FLIP_DURATION);
    }

    // Wait for last tile to finish
    await new Promise(resolve => setTimeout(resolve, WORD_LENGTH * FLIP_DELAY + FLIP_DURATION));
  }

  // ---- End game ----
  function _endGame(won, word, data) {
    _state.isGameOver = true;

    if (!_state.isPracticeMode) {
      _updateStreakDisplay();
    }

    setTimeout(() => {
      Stats.showResultModal(won, word, data);
    }, 400);
  }

  // ---- Helpers ----
  function _shakeCurrentRow() {
    const grid = document.getElementById('tile-grid');
    grid.classList.add('grid--shake');
    setTimeout(() => grid.classList.remove('grid--shake'), 500);
  }

  function _showMessage(msg) {
    const area = document.getElementById('message-area');
    if (area) area.textContent = msg;
  }

  async function _updateStreakDisplay() {
    try {
      const token = localStorage.getItem('nwg_token');
      if (!token) return;
      const stats = await Api.getStats();
      const el    = document.getElementById('streak-count');
      if (el) el.textContent = stats.currentStreak;
    } catch {}
  }

  /**
   * Tokenize Devanagari string into akshara units.
   * Uses Intl.Segmenter if available (modern browsers).
   */
  function tokenize(text) {
    if (!text) return [];
    const normalized = text.normalize('NFC');
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const seg = new Intl.Segmenter('ne', { granularity: 'grapheme' });
      return [...seg.segment(normalized)].map(s => s.segment);
    }
    // Fallback
    return [...normalized];
  }

  async function setPracticeMode(val) {
    _state.isPracticeMode = val;
    _state.practiceToken  = null;
    _state.currentRow     = 0;
    _state.currentInput   = [];
    _state.isGameOver     = false;

    _buildGrid();
    Keyboard.reset();

    const streakBar      = document.getElementById('streak-bar');
    const practiceBadge  = document.getElementById('practice-badge');
    const modeBtn        = document.getElementById('nav-game-mode-btn');
    const verifyBanner   = document.getElementById('verify-banner');

    if (val) {
      if (streakBar) streakBar.classList.add('hidden');
      if (practiceBadge) practiceBadge.classList.remove('hidden');
      if (modeBtn) modeBtn.textContent = 'Daily Game 📅';
      if (verifyBanner) verifyBanner.classList.add('hidden');
      await _loadPracticeChallenge();
    } else {
      if (streakBar && localStorage.getItem('nwg_token') && (typeof App === 'undefined' || App.isVerified())) {
        streakBar.classList.remove('hidden');
      }
      if (practiceBadge) practiceBadge.classList.add('hidden');
      if (modeBtn) modeBtn.textContent = 'Practice Game 🎮';
      // Show verify banner if logged in but not verified
      if (typeof App !== 'undefined' && App.isLoggedIn() && !App.isVerified()) {
        if (verifyBanner) verifyBanner.classList.remove('hidden');
      }
      await _loadDailyChallenge();
    }
  }

  async function _loadPracticeChallenge() {
    try {
      _showMessage('Loading practice game...');
      const data = await Api.getPractice();
      _state.practiceToken = data.practiceToken;
      _state.currentRow    = 0;
      _state.currentInput  = [];
      _state.isGameOver    = false;
      _showMessage('');
      _markCurrentRow();
    } catch (err) {
      _showMessage(err.message || 'Failed to load practice game');
    }
  }

  function reset() {
    const isPractice = _state.isPracticeMode;
    _state = { 
      currentRow: 0, 
      currentInput: [], 
      tiles: [], 
      isGameOver: false, 
      challengeId: null,
      isPracticeMode: isPractice,
      practiceToken: null
    };
    Keyboard.reset();
    _buildGrid();
    if (isPractice) {
      _loadPracticeChallenge();
    } else {
      _loadDailyChallenge();
    }
  }

  return { init, reset, tokenize, setPracticeMode, isPracticeMode: () => _state.isPracticeMode };
})();
