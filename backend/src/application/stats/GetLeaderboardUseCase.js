// =============================================================
// Use Case: GetLeaderboardUseCase  (FR-7)
// =============================================================

class GetLeaderboardUseCase {
  constructor(leaderboardRepo) {
    this.leaderboardRepo = leaderboardRepo;
  }

  /**
   * @param {{ userId: number|null, limit: number }} dto
   * @returns {Promise<object>}
   */
  async execute({ userId = null, limit = 20 }) {
    const top = await this.leaderboardRepo.getTopN(limit);

    let userRank = null;
    if (userId) {
      userRank = await this.leaderboardRepo.getUserRank(userId);
    }

    return { leaderboard: top, userRank };
  }
}

module.exports = GetLeaderboardUseCase;
