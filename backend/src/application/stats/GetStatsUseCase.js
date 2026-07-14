// =============================================================
// Use Case: GetStatsUseCase  (FR-6 — streak display)
// =============================================================

class GetStatsUseCase {
  constructor(leaderboardRepo) {
    this.leaderboardRepo = leaderboardRepo;
  }

  /**
   * @param {{ userId: number }} dto
   * @returns {Promise<object>}
   */
  async execute({ userId }) {
    const stat = await this.leaderboardRepo.findByUserId(userId);

    if (!stat) {
      return {
        currentStreak: 0,
        maxStreak:     0,
        totalWins:     0,
        gamesPlayed:   0,
        winRate:       0,
      };
    }

    const winRate = stat.gamesPlayed > 0
      ? Math.round((stat.totalWins / stat.gamesPlayed) * 100)
      : 0;

    return {
      currentStreak: stat.currentStreak,
      maxStreak:     stat.maxStreak,
      totalWins:     stat.totalWins,
      gamesPlayed:   stat.gamesPlayed,
      winRate,
    };
  }
}

module.exports = GetStatsUseCase;
