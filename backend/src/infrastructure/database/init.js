// =============================================================
// Infrastructure: MySQL2 Database Initializer & Seeder
// =============================================================

const { getPool } = require('./pool');

const SEED_WORDS = [
  'नेपाल', 'किताब', 'समय', 'बजार', 'सडक', 'जंगल', 'पहाड', 'आकाश', 'जमीन', 'पसल', 'सफल', 'सुन्दर',
  'मनोज', 'सुमन', 'रमेश', 'बिरामी', 'संगीत', 'कविता', 'कहानी', 'विज्ञान', 'गणित', 'बालक', 'बालिका',
  'शिक्षक', 'विद्यार्थी', 'समाज', 'नियम', 'खुराक', 'औषधि', 'प्रकृति', 'बगैंचा', 'उब्जनी', 'किसान',
  'पर्वत', 'हिमाल', 'नहर', 'शहर', 'मोटर', 'हवाई', 'जहाज', 'कमल', 'कलम', 'घटना', 'जमाना', 'तस्वीर',
  'बदाम', 'भोजन', 'मदद', 'मौसम', 'रकम', 'लडाई', 'विचार', 'सपना', 'संसार', 'हालत', 'हिसाब'
];

async function initializeDatabase() {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    console.log('[Database] Checking/initializing tables...');

    // 1. Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email        VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        username     VARCHAR(100) NOT NULL,
        is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
        verification_token VARCHAR(255) DEFAULT NULL,
        verification_expires DATETIME DEFAULT NULL,
        created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_verification_token (verification_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS words (
        word_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        word_text   VARCHAR(50) NOT NULL UNIQUE,
        unit_count  TINYINT UNSIGNED NOT NULL DEFAULT 3,
        added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_words_text (word_text)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_challenges (
        challenge_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        word_id        INT UNSIGNED NOT NULL,
        challenge_date DATE NOT NULL UNIQUE,
        created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE RESTRICT,
        INDEX idx_challenge_date (challenge_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS guess_attempts (
        attempt_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id        INT UNSIGNED NOT NULL,
        challenge_id   INT UNSIGNED NOT NULL,
        guess_text     VARCHAR(50) NOT NULL,
        feedback       JSON NOT NULL,
        attempt_number TINYINT UNSIGNED NOT NULL,
        is_correct     BOOLEAN NOT NULL DEFAULT FALSE,
        submitted_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES daily_challenges(challenge_id) ON DELETE CASCADE,
        UNIQUE KEY uq_user_challenge_attempt (user_id, challenge_id, attempt_number),
        INDEX idx_attempts_user_challenge (user_id, challenge_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_stats (
        user_id         INT UNSIGNED PRIMARY KEY,
        current_streak  INT UNSIGNED NOT NULL DEFAULT 0,
        max_streak      INT UNSIGNED NOT NULL DEFAULT 0,
        total_wins      INT UNSIGNED NOT NULL DEFAULT 0,
        games_played    INT UNSIGNED NOT NULL DEFAULT 0,
        last_played_date DATE,
        last_won_date    DATE,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_lb_total_wins (total_wins DESC, current_streak DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('[Database] Tables verified/created successfully.');

    // 2. Check if words are already seeded
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM words');
    if (rows[0].count === 0) {
      console.log('[Database] No words found. Seeding initial vocabulary...');
      const values = SEED_WORDS.map(word => [word, 3]);
      await connection.query('INSERT INTO words (word_text, unit_count) VALUES ?', [values]);
      console.log(`[Database] Seeded ${SEED_WORDS.length} words.`);
    }

    // 3. Ensure a challenge exists for today
    const [challengeRows] = await connection.query(
      'SELECT challenge_id FROM daily_challenges WHERE challenge_date = CURDATE()'
    );
    if (challengeRows.length === 0) {
      console.log('[Database] No daily challenge found for today. Creating one...');
      await connection.query(`
        INSERT INTO daily_challenges (word_id, challenge_date)
        SELECT word_id, CURDATE()
        FROM words
        ORDER BY RAND()
        LIMIT 1
      `);
      console.log('[Database] Daily challenge created successfully.');
    }
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { initializeDatabase };
