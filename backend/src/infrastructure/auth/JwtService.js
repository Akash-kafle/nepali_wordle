// =============================================================
// Infrastructure: JwtService
// =============================================================

const jwt = require('jsonwebtoken');

class JwtService {
  constructor() {
    this.secret     = process.env.JWT_SECRET || 'change_me_in_production';
    this.expiresIn  = process.env.JWT_EXPIRES_IN || '7d';
  }

  sign(payload, expiresIn) {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn || this.expiresIn });
  }

  verify(token) {
    return jwt.verify(token, this.secret);
  }
}

module.exports = JwtService;
