// =============================================================
// Infrastructure: MySQLUserRepository
// =============================================================

const { getPool } = require('./pool');
const User        = require('../../domain/entities/User');

class MySQLUserRepository {
  async findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT user_id, email, password_hash, username, is_verified,
              verification_token, verification_expires, created_at
       FROM users WHERE email = ?`,
      [email]
    );
    if (!rows.length) return null;
    return this._mapRow(rows[0]);
  }

  async findById(userId) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT user_id, email, password_hash, username, is_verified,
              verification_token, verification_expires, created_at
       FROM users WHERE user_id = ?`,
      [userId]
    );
    if (!rows.length) return null;
    return this._mapRow(rows[0]);
  }

  async findByVerificationToken(token) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT user_id, email, password_hash, username, is_verified,
              verification_token, verification_expires, created_at
       FROM users WHERE verification_token = ?`,
      [token]
    );
    if (!rows.length) return null;
    return this._mapRow(rows[0]);
  }

  async create({ email, passwordHash, username, verificationToken, verificationExpires }) {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, username, is_verified, verification_token, verification_expires)
       VALUES (?, ?, ?, FALSE, ?, ?)`,
      [email, passwordHash, username, verificationToken || null, verificationExpires || null]
    );
    return this._mapRow({
      user_id:              result.insertId,
      email,
      password_hash:        passwordHash,
      username,
      is_verified:          0,
      verification_token:   verificationToken || null,
      verification_expires: verificationExpires || null,
      created_at:           new Date(),
    });
  }

  async updateVerification(userId, { isVerified, verificationToken, verificationExpires }) {
    const pool = getPool();
    await pool.execute(
      `UPDATE users
       SET is_verified = ?, verification_token = ?, verification_expires = ?
       WHERE user_id = ?`,
      [
        isVerified ? 1 : 0,
        verificationToken ?? null,
        verificationExpires ?? null,
        userId,
      ]
    );
  }

  _mapRow(row) {
    return new User({
      userId:              row.user_id,
      email:               row.email,
      passwordHash:        row.password_hash,
      username:            row.username,
      isVerified:          Boolean(row.is_verified),
      verificationToken:   row.verification_token,
      verificationExpires: row.verification_expires,
      createdAt:           row.created_at,
    });
  }
}

module.exports = MySQLUserRepository;
