-- =============================================================
-- Nepali Word Game — Database Schema
-- MySQL 8.0+
-- =============================================================

SET NAMES utf8mb4;

-- CREATE DATABASE IF NOT EXISTS nepali_word_game
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;
-- 
-- USE nepali_word_game;

-- -------------------------------------------------------------
-- users
-- -------------------------------------------------------------
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- words  (curated 3-akshara Nepali words)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS words (
  word_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  word_text   VARCHAR(50) NOT NULL UNIQUE,
  unit_count  TINYINT UNSIGNED NOT NULL DEFAULT 3,
  added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_words_text (word_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- daily_challenges
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_challenges (
  challenge_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  word_id        INT UNSIGNED NOT NULL,
  challenge_date DATE NOT NULL UNIQUE,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (word_id) REFERENCES words(word_id) ON DELETE RESTRICT,
  INDEX idx_challenge_date (challenge_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- guess_attempts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guess_attempts (
  attempt_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  challenge_id   INT UNSIGNED NOT NULL,
  guess_text     VARCHAR(50) NOT NULL,
  feedback       JSON NOT NULL,          -- array of {unit, status: 'green'|'yellow'|'grey'}
  attempt_number TINYINT UNSIGNED NOT NULL,
  is_correct     BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES daily_challenges(challenge_id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_challenge_attempt (user_id, challenge_id, attempt_number),
  INDEX idx_attempts_user_challenge (user_id, challenge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- leaderboard_stats  (one row per user, upserted after each game)
-- -------------------------------------------------------------
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
