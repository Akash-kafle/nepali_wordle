// =============================================================
// Domain Entity: LeaderboardStat
// =============================================================

class LeaderboardStat {
  constructor({ userId, username, currentStreak, maxStreak, totalWins, gamesPlayed, lastPlayedDate, lastWonDate }) {
    this.userId        = userId;
    this.username      = username;
    this.currentStreak = currentStreak || 0;
    this.maxStreak     = maxStreak     || 0;
    this.totalWins     = totalWins     || 0;
    this.gamesPlayed   = gamesPlayed   || 0;
    this.lastPlayedDate = lastPlayedDate || null;
    this.lastWonDate    = lastWonDate    || null;
  }
}

module.exports = LeaderboardStat;
