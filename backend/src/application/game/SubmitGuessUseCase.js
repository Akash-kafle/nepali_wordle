// =============================================================
// Use Case: SubmitGuessUseCase  (FR-4 + FR-5)
// =============================================================

class SubmitGuessUseCase {
  constructor(dailyChallengeRepo, guessAttemptRepo, feedbackEngine, leaderboardRepo, spellingService) {
    this.dailyChallengeRepo = dailyChallengeRepo;
    this.guessAttemptRepo   = guessAttemptRepo;
    this.feedbackEngine     = feedbackEngine;
    this.leaderboardRepo    = leaderboardRepo;
    this.spellingService    = spellingService;
  }

  /**
   * @param {{ userId: number, date: string, guessText: string }} dto
   * @returns {Promise<object>}
   */
  async execute({ userId, date, guessText }) {
    // Load today's challenge
    const challenge = await this.dailyChallengeRepo.findByDate(date);
    if (!challenge) {
      throw Object.assign(new Error('No challenge for today'), { statusCode: 404 });
    }

    // Load existing attempts
    const existingAttempts = await this.guessAttemptRepo.findByUserAndChallenge(userId, challenge.challengeId);

    // Check game hasn't ended
    const alreadyWon = existingAttempts.some(a => a.isCorrect);
    if (alreadyWon) {
      throw Object.assign(new Error('You have already won today'), { statusCode: 409 });
    }
    if (existingAttempts.length >= 6) {
      throw Object.assign(new Error('No attempts remaining'), { statusCode: 409 });
    }

    // Validate guess (must be non-empty; unit count check done in feedback engine)
    const guessUnits = this.feedbackEngine.tokenize(guessText);
    if (guessUnits.length !== 3) {
      throw Object.assign(
        new Error(`Guess must have exactly 3 units, got ${guessUnits.length}`),
        { statusCode: 400 }
      );
    }

    // Validate that the word exists in the dictionary
    const isValid = await this.spellingService.isValidWord(guessText);
    if (!isValid) {
      throw Object.assign(
        new Error(`"${guessText}" is not a valid Nepali word`),
        { statusCode: 400 }
      );
    }

    // Compute feedback
    const targetUnits = this.feedbackEngine.tokenize(challenge.wordText);
    const feedback    = this.feedbackEngine.compute(guessUnits, targetUnits);
    const isCorrect   = feedback.every(f => f.status === 'green');
    const attemptNumber = existingAttempts.length + 1;

    // Persist attempt
    const attempt = await this.guessAttemptRepo.create({
      userId,
      challengeId:   challenge.challengeId,
      guessText,
      feedback,
      attemptNumber,
      isCorrect,
    });

    // Determine game over
    const gameOver = isCorrect || attemptNumber >= 6;

    // Update leaderboard stats if game is over
    if (gameOver) {
      await this._updateStats(userId, isCorrect, date);
    }

    return {
      feedback,
      isCorrect,
      attemptNumber,
      attemptsLeft: Math.max(0, 6 - attemptNumber),
      gameOver,
      won: isCorrect,
      // Reveal word only on game over
      word: gameOver ? challenge.wordText : null,
    };
  }

  async _updateStats(userId, won, todayDate) {
    let stat = await this.leaderboardRepo.findByUserId(userId);

    if (!stat) {
      stat = {
        userId,
        currentStreak: 0,
        maxStreak:     0,
        totalWins:     0,
        gamesPlayed:   0,
        lastPlayedDate: null,
        lastWonDate:    null,
      };
    }

    stat.gamesPlayed += 1;
    stat.lastPlayedDate = todayDate;

    if (won) {
      stat.totalWins += 1;
      // Calculate streak
      const yesterday = this._offsetDate(todayDate, -1);
      if (stat.lastWonDate === yesterday) {
        stat.currentStreak += 1;
      } else {
        stat.currentStreak = 1;
      }
      stat.maxStreak   = Math.max(stat.maxStreak, stat.currentStreak);
      stat.lastWonDate = todayDate;
    } else {
      // Loss — streak resets
      stat.currentStreak = 0;
    }

    await this.leaderboardRepo.upsert(stat);
  }

  _offsetDate(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
}

module.exports = SubmitGuessUseCase;
