// =============================================================
// Controller: StatsController
// =============================================================

class StatsController {
  constructor(getStatsUseCase, getLeaderboardUseCase) {
    this.getStatsUseCase       = getStatsUseCase;
    this.getLeaderboardUseCase = getLeaderboardUseCase;
  }

  /** GET /api/stats */
  getStats = async (req, res, next) => {
    try {
      const data = await this.getStatsUseCase.execute({ userId: req.user.userId });
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/leaderboard */
  getLeaderboard = async (req, res, next) => {
    try {
      const limit  = Math.min(parseInt(req.query.limit || '20', 10), 100);
      const userId = req.user?.userId || null;
      const data   = await this.getLeaderboardUseCase.execute({ userId, limit });
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = StatsController;
