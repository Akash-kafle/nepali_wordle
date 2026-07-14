-- =============================================================
-- Migration 001: Email Verification
-- Run this on existing databases to add email verification columns
-- =============================================================

USE nepali_word_game;

ALTER TABLE users
  ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER username,
  ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL AFTER is_verified,
  ADD COLUMN verification_expires DATETIME DEFAULT NULL AFTER verification_token,
  ADD INDEX idx_users_verification_token (verification_token);

-- Mark all existing users as verified (they registered before verification was required)
UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE;
