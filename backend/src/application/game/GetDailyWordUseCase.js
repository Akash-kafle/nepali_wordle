// =============================================================
// Use Case: GetDailyWordUseCase  (FR-3)
// Returns today's challenge metadata — word text NOT revealed
// =============================================================

class GetDailyWordUseCase {
  constructor(dailyChallengeRepo, guessAttemptRepo) {
    this.dailyChallengeRepo = dailyChallengeRepo;
    this.guessAttemptRepo   = guessAttemptRepo;
  }

  /**
   * @param {{ userId: number|null, date: string }} dto
   * @returns {Promise<object>}
   */
  async execute({ userId, date }) {
    const challenge = await this.dailyChallengeRepo.findByDate(date);

    if (!challenge) {
      throw Object.assign(new Error('No challenge available for today'), { statusCode: 404 });
    }

    let attempts    = [];
    let gameOver    = false;
    let won         = false;
    let attemptsLeft = 6;

    if (userId) {
      attempts = await this.guessAttemptRepo.findByUserAndChallenge(userId, challenge.challengeId);
      won      = attempts.some(a => a.isCorrect);
      gameOver = won || attempts.length >= 6;
      attemptsLeft = Math.max(0, 6 - attempts.length);
    }

    return {
      challengeId:   challenge.challengeId,
      challengeDate: challenge.challengeDate,
      attemptsLeft,
      attempts,
      gameOver,
      won,
      // Only reveal word if game is over
      word: gameOver ? challenge.wordText : null,
    };
  }
}

module.exports = GetDailyWordUseCase;
