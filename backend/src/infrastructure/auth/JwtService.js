// =============================================================
// Infrastructure: JwtService
// =============================================================

const jwt = require('jsonwebtoken');

class JwtService {
  constructor() {
    if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me_in_production ->  no ahahahhaah')) {
      throw new Error('FATAL: JWT_SECRET environment variable is unset or insecure in production mode.');
    }
    this.secret = process.env.JWT_SECRET || 'change_me_in_production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  sign(payload, expiresIn) {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn || this.expiresIn });
  }

  verify(token) {
    return jwt.verify(token, this.secret);
  }
}

module.exports = JwtService;
