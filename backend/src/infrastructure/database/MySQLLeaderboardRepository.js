// =============================================================
// Infrastructure: MySQLLeaderboardRepository
// =============================================================

const { getPool }    = require('./pool');
const LeaderboardStat = require('../../domain/entities/LeaderboardStat');

class MySQLLeaderboardRepository {
  async findByUserId(userId) {
    const pool  = getPool();
    const [rows] = await pool.execute(
      `SELECT ls.user_id, u.username, ls.current_streak, ls.max_streak,
              ls.total_wins, ls.games_played, ls.last_played_date, ls.last_won_date
       FROM leaderboard_stats ls
       JOIN users u ON ls.user_id = u.user_id
       WHERE ls.user_id = ?`,
      [userId]
    );
    if (!rows.length) return null;
    return this._mapRow(rows[0]);
  }

  async upsert(stat) {
    const pool  = getPool();
    await pool.execute(
      `INSERT INTO leaderboard_stats
         (user_id, current_streak, max_streak, total_wins, games_played, last_played_date, last_won_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         current_streak  = VALUES(current_streak),
         max_streak      = VALUES(max_streak),
         total_wins      = VALUES(total_wins),
         games_played    = VALUES(games_played),
         last_played_date = VALUES(last_played_date),
         last_won_date   = VALUES(last_won_date),
         updated_at      = CURRENT_TIMESTAMP`,
      [
        stat.userId,
        stat.currentStreak,
        stat.maxStreak,
        stat.totalWins,
        stat.gamesPlayed,
        stat.lastPlayedDate || null,
        stat.lastWonDate    || null,
      ]
    );
    return this.findByUserId(stat.userId);
  }

  async getTopN(limit = 20) {
    const pool  = getPool();
    // Use query() with inlined limit (safe — limit is always cast to int)
    const safeLimit = parseInt(limit, 10) || 20;
    const [rows] = await pool.query(
      `SELECT ls.user_id, u.username, ls.current_streak, ls.max_streak,
              ls.total_wins, ls.games_played, ls.last_played_date, ls.last_won_date
       FROM leaderboard_stats ls
       JOIN users u ON ls.user_id = u.user_id
       ORDER BY ls.total_wins DESC, ls.current_streak DESC
       LIMIT ${safeLimit}`
    );
    return rows.map(this._mapRow);
  }

  async getUserRank(userId) {
    const pool  = getPool();
    const [rows] = await pool.execute(
      `SELECT COUNT(*) + 1 AS rank_pos
       FROM leaderboard_stats ls2
       JOIN leaderboard_stats ls1 ON ls1.user_id = ?
       WHERE ls2.total_wins > ls1.total_wins
         OR (ls2.total_wins = ls1.total_wins AND ls2.current_streak > ls1.current_streak)`,
      [userId]
    );
    return rows[0]?.rank_pos ?? null;
  }

  _mapRow(row) {
    const fmt = (d) => d instanceof Date ? d.toISOString().slice(0, 10) : (d ? String(d) : null);
    return new LeaderboardStat({
      userId:        row.user_id,
      username:      row.username,
      currentStreak: row.current_streak,
      maxStreak:     row.max_streak,
      totalWins:     row.total_wins,
      gamesPlayed:   row.games_played,
      lastPlayedDate: fmt(row.last_played_date),
      lastWonDate:    fmt(row.last_won_date),
    });
  }
}

module.exports = MySQLLeaderboardRepository;
