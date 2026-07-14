// =============================================================
// stats.js — Result modal, stats modal, leaderboard view
// =============================================================

const Stats = (() => {

  // ---- Result / Win-Loss Modal ----
  function showResultModal(won, word, data) {
    const modal      = document.getElementById('modal-result');
    const emojiEl    = document.getElementById('modal-emoji');
    const titleEl    = document.getElementById('modal-result-title');
    const subtitleEl = document.getElementById('modal-subtitle');
    const statsEl    = document.getElementById('modal-result-stats');
    const wordEl     = document.getElementById('modal-word-reveal');

    emojiEl.textContent  = won ? '🎉' : '😔';
    titleEl.textContent  = won ? 'शाबाश! You Won!' : 'Better Luck Tomorrow';
    subtitleEl.textContent = won
      ? `Solved in ${data.attemptNumber} attempt${data.attemptNumber > 1 ? 's' : ''}!`
      : 'The word was:';

    wordEl.innerHTML = '';
    if (word) {
      wordEl.textContent = word;
      wordEl.style.display = 'block';
    } else {
      wordEl.style.display = 'none';
    }

    const isPractice  = Game.isPracticeMode();
    const countdownEl = document.querySelector('.modal-countdown');
    const practiceBtn = document.getElementById('modal-practice-btn');

    if (isPractice) {
      if (countdownEl) countdownEl.style.display = 'none';
      if (practiceBtn) {
        practiceBtn.classList.remove('hidden');
        practiceBtn.onclick = () => {
          modal.classList.add('hidden');
          Game.setPracticeMode(true); // Restarts/generates new practice game
        };
      }
      statsEl.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;padding:0.5rem 0;">Practice games do not affect your daily streak.</div>';
    } else {
      if (countdownEl) countdownEl.style.display = 'flex';
      if (practiceBtn) practiceBtn.classList.add('hidden');

      // Load user stats for the modal (Daily Mode only)
      statsEl.innerHTML = '';
      const token = localStorage.getItem('nwg_token');
      if (token) {
        Api.getStats().then(stats => {
          statsEl.innerHTML = `
            <div class="modal-stat">
              <div class="modal-stat-value">${stats.currentStreak}</div>
              <div class="modal-stat-label">🔥 Streak</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">${stats.totalWins}</div>
              <div class="modal-stat-label">✅ Wins</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">${stats.winRate}%</div>
              <div class="modal-stat-label">Win Rate</div>
            </div>
          `;
        }).catch(() => {});
      }
    }

    if (!isPractice) {
      _startCountdown();
    }

    modal.classList.remove('hidden');

    // Close button
    document.getElementById('modal-close-btn').onclick = () => modal.classList.add('hidden');
    document.getElementById('modal-share-btn').onclick  = () => _shareResult(won, word, data);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  function _startCountdown() {
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    function update() {
      const now     = new Date();
      // Next midnight NPT = next UTC 18:15
      const utcNow  = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptNow  = new Date(utcNow + (5 * 60 + 45) * 60000);
      const midnight = new Date(nptNow);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight - nptNow;
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);
      timerEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    update();
    const id = setInterval(update, 1000);
    // Clear on modal close
    document.getElementById('modal-close-btn').addEventListener('click', () => clearInterval(id), { once: true });
  }

  function _shareResult(won, word, data) {
    const emojiMap = { green: '🟢', blue: '🔵', yellow: '🟡', grey: '⬛' };
    const attempts = data.attempts || [];
    const grid     = attempts.map(a =>
      a.feedback.map(f => emojiMap[f.status] || '⬛').join('')
    ).join('\n');

    const text = `नेपाली शब्द खेल ${won ? '✅' : '❌'} ${data.attemptNumber ?? '?'}/6\n\n${grid}\n\nPlay: ${window.location.href}`;

    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        App.showToast('Result copied! 📋');
      }).catch(() => {
        App.showToast('Copy failed — paste manually');
      });
    }
  }

  // ---- Stats Modal ----
  async function showStatsModal() {
    const modal = document.getElementById('modal-stats');
    const grid  = document.getElementById('stats-grid');

    grid.innerHTML = '<div class="spinner"></div>';
    modal.classList.remove('hidden');

    try {
      const stats = await Api.getStats();
      const winRate = stats.gamesPlayed > 0 ? Math.round((stats.totalWins / stats.gamesPlayed) * 100) : 0;

      grid.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-value">${stats.gamesPlayed}</div>
          <div class="stat-card-label">Played</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.winRate ?? winRate}%</div>
          <div class="stat-card-label">Win Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.currentStreak}</div>
          <div class="stat-card-label">🔥 Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.maxStreak}</div>
          <div class="stat-card-label">Best Streak</div>
        </div>
      `;
    } catch {
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center">Sign in to see stats</p>';
    }

    document.getElementById('stats-close-btn').onclick = () => modal.classList.add('hidden');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  // ---- Leaderboard View ----
  async function loadLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    const banner    = document.getElementById('user-rank-banner');
    container.innerHTML = '<div class="lb-empty"><div class="spinner"></div></div>';

    try {
      const userId = _getLocalUserId();
      const data   = await Api.getLeaderboard(20);
      const { leaderboard, userRank } = data;

      if (!leaderboard || leaderboard.length === 0) {
        container.innerHTML = '<div class="lb-empty">No players yet — be the first! 🚀</div>';
        return;
      }

      const medals = ['🥇', '🥈', '🥉'];

      container.innerHTML = leaderboard.map((player, idx) => {
        const rank     = idx + 1;
        const rankHtml = rank <= 3
          ? `<span class="lb-rank lb-rank--medal">${medals[rank-1]}</span>`
          : `<span class="lb-rank">${rank}</span>`;
        const isMe     = player.userId === userId;
        const rowClass = rank <= 3 ? `lb-row--top${rank}` : isMe ? 'lb-row--me' : '';

        return `
          <div class="lb-row ${rowClass}" aria-label="Rank ${rank}: ${player.username}">
            ${rankHtml}
            <div>
              <div class="lb-name">${_esc(player.username)} ${isMe ? '(You)' : ''}</div>
              <div class="lb-meta">Streak: 🔥${player.currentStreak} · Played: ${player.gamesPlayed}</div>
            </div>
            <div>
              <div class="lb-wins">${player.totalWins}</div>
              <div class="lb-wins-label">wins</div>
            </div>
          </div>
        `;
      }).join('');

      if (userRank && userId) {
        banner.innerHTML = `Your current rank: <strong>#${userRank}</strong>`;
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }

    } catch (err) {
      container.innerHTML = `<div class="lb-empty">${err.message || 'Failed to load leaderboard'}</div>`;
    }
  }

  function _getLocalUserId() {
    try {
      const token = localStorage.getItem('nwg_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch { return null; }
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { showResultModal, showStatsModal, loadLeaderboard };
})();
