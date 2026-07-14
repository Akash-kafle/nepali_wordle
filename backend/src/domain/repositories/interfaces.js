// =============================================================
// Domain Repository Interfaces
// These define the contracts that infrastructure must implement.
// No implementation here — just documentation via JS class.
// =============================================================

class IUserRepository {
  /** @param {string} email @returns {Promise<User|null>} */
  async findByEmail(email) { throw new Error('Not implemented'); }

  /** @param {User} user @returns {Promise<User>} */
  async create(user) { throw new Error('Not implemented'); }

  /** @param {number} userId @returns {Promise<User|null>} */
  async findById(userId) { throw new Error('Not implemented'); }

  /** @param {string} token @returns {Promise<User|null>} */
  async findByVerificationToken(token) { throw new Error('Not implemented'); }

  /**
   * Update email verification fields
   * @param {number} userId
   * @param {{ isVerified?: boolean, verificationToken?: string|null, verificationExpires?: Date|null }} data
   * @returns {Promise<void>}
   */
  async updateVerification(userId, data) { throw new Error('Not implemented'); }
}

class IWordRepository {
  /** @returns {Promise<Word[]>} */
  async findAll() { throw new Error('Not implemented'); }

  /**
   * Find a word not used in the last N days
   * @param {number} excludeDays
   * @returns {Promise<Word|null>}
   */
  async findUnusedWord(excludeDays) { throw new Error('Not implemented'); }
}

class IDailyChallengeRepository {
  /** @param {string} date YYYY-MM-DD @returns {Promise<DailyChallenge|null>} */
  async findByDate(date) { throw new Error('Not implemented'); }

  /** @param {DailyChallenge} challenge @returns {Promise<DailyChallenge>} */
  async create(challenge) { throw new Error('Not implemented'); }
}

class IGuessAttemptRepository {
  /** @param {GuessAttempt} attempt @returns {Promise<GuessAttempt>} */
  async create(attempt) { throw new Error('Not implemented'); }

  /**
   * @param {number} userId
   * @param {number} challengeId
   * @returns {Promise<GuessAttempt[]>}
   */
  async findByUserAndChallenge(userId, challengeId) { throw new Error('Not implemented'); }
}

class ILeaderboardRepository {
  /** @param {number} userId @returns {Promise<LeaderboardStat|null>} */
  async findByUserId(userId) { throw new Error('Not implemented'); }

  /** @param {LeaderboardStat} stat @returns {Promise<LeaderboardStat>} */
  async upsert(stat) { throw new Error('Not implemented'); }

  /**
   * @param {number} limit
   * @returns {Promise<LeaderboardStat[]>}
   */
  async getTopN(limit) { throw new Error('Not implemented'); }

  /** @param {number} userId @returns {Promise<number>} */
  async getUserRank(userId) { throw new Error('Not implemented'); }
}

module.exports = {
  IUserRepository,
  IWordRepository,
  IDailyChallengeRepository,
  IGuessAttemptRepository,
  ILeaderboardRepository,
};
