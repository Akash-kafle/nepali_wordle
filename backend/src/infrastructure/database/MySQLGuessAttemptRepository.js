// =============================================================
// Infrastructure: MySQLGuessAttemptRepository
// =============================================================

const { getPool }   = require('./pool');
const GuessAttempt  = require('../../domain/entities/GuessAttempt');

class MySQLGuessAttemptRepository {
  async create({ userId, challengeId, guessText, feedback, attemptNumber, isCorrect }) {
    const pool  = getPool();
    const [result] = await pool.execute(
      `INSERT INTO guess_attempts
         (user_id, challenge_id, guess_text, feedback, attempt_number, is_correct)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, challengeId, guessText, JSON.stringify(feedback), attemptNumber, isCorrect ? 1 : 0]
    );
    return new GuessAttempt({
      attemptId: result.insertId,
      userId, challengeId, guessText, feedback, attemptNumber, isCorrect,
      submittedAt: new Date(),
    });
  }

  async findByUserAndChallenge(userId, challengeId) {
    const pool  = getPool();
    const [rows] = await pool.execute(
      `SELECT attempt_id, user_id, challenge_id, guess_text, feedback,
              attempt_number, is_correct, submitted_at
       FROM guess_attempts
       WHERE user_id = ? AND challenge_id = ?
       ORDER BY attempt_number ASC`,
      [userId, challengeId]
    );
    return rows.map(row => new GuessAttempt({
      attemptId:     row.attempt_id,
      userId:        row.user_id,
      challengeId:   row.challenge_id,
      guessText:     row.guess_text,
      feedback:      typeof row.feedback === 'string' ? JSON.parse(row.feedback) : row.feedback,
      attemptNumber: row.attempt_number,
      isCorrect:     Boolean(row.is_correct),
      submittedAt:   row.submitted_at,
    }));
  }
}

module.exports = MySQLGuessAttemptRepository;
