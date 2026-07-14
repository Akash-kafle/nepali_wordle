// =============================================================
// Infrastructure: BcryptService  (NFR-3)
// =============================================================

const bcrypt = require('bcryptjs');

class BcryptService {
  constructor(saltRounds = 12) {
    this.saltRounds = saltRounds;
  }

  async hash(plain) {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}

module.exports = BcryptService;
