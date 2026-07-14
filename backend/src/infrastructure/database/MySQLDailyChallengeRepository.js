// =============================================================
// Infrastructure: MySQLDailyChallengeRepository
// =============================================================

const { getPool }      = require('./pool');
const DailyChallenge   = require('../../domain/entities/DailyChallenge');

class MySQLDailyChallengeRepository {
  async findByDate(date) {
    const pool  = getPool();
    const [rows] = await pool.execute(
      `SELECT dc.challenge_id, dc.word_id, w.word_text, dc.challenge_date, dc.created_at
       FROM daily_challenges dc
       JOIN words w ON dc.word_id = w.word_id
       WHERE dc.challenge_date = ?`,
      [date]
    );
    if (!rows.length) return null;
    return this._mapRow(rows[0]);
  }

  async create({ wordId, challengeDate }) {
    const pool  = getPool();
    const [result] = await pool.execute(
      'INSERT INTO daily_challenges (word_id, challenge_date) VALUES (?, ?)',
      [wordId, challengeDate]
    );
    // Re-fetch to get the word text
    return this.findByDate(challengeDate);
  }

  _mapRow(row) {
    return new DailyChallenge({
      challengeId:   row.challenge_id,
      wordId:        row.word_id,
      wordText:      row.word_text,
      challengeDate: row.challenge_date instanceof Date
        ? row.challenge_date.toISOString().slice(0, 10)
        : String(row.challenge_date),
      createdAt: row.created_at,
    });
  }
}

module.exports = MySQLDailyChallengeRepository;
