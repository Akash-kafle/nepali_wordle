// =============================================================
// Controller: GameController
// =============================================================

class GameController {
  constructor(getDailyWordUseCase, submitGuessUseCase, wordRepo, jwtSvc, feedbackEngine, spellingService) {
    this.getDailyWordUseCase = getDailyWordUseCase;
    this.submitGuessUseCase  = submitGuessUseCase;
    this.wordRepo            = wordRepo;
    this.jwtSvc              = jwtSvc;
    this.feedbackEngine      = feedbackEngine;
    this.spellingService     = spellingService;
  }

  /** GET /api/game/daily */
  getDaily = async (req, res, next) => {
    try {
      const todayNPT = this._getTodayNPT();
      const userId   = req.user?.userId || null;
      const data     = await this.getDailyWordUseCase.execute({ userId, date: todayNPT });
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/game/practice */
  getPractice = async (req, res, next) => {
    try {
      const word = await this.wordRepo.findRandom();
      if (!word) {
        return res.status(404).json({ error: 'No words available in database' });
      }

      // Generate a temporary 1-hour signed JWT containing the target word
      const practiceToken = this.jwtSvc.sign(
        { wordText: word.wordText, wordId: word.wordId },
        '1h'
      );

      res.json({ practiceToken });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/game/guess */
  submitGuess = async (req, res, next) => {
    try {
      const { guessText, practiceToken, attemptNumber } = req.body;
      if (!guessText) {
        return res.status(400).json({ error: 'guessText is required' });
      }

      const guessTrimmed = guessText.trim();

      // Handle practice mode guess (stateless)
      if (practiceToken) {
        try {
          const payload = this.jwtSvc.verify(practiceToken);
          const targetWord = payload.wordText;

          const guessUnits = this.feedbackEngine.tokenize(guessTrimmed);
          if (guessUnits.length !== 3) {
            return res.status(400).json({ error: 'Guess must have exactly 3 units' });
          }

          // Validate that the word exists in the dictionary
          const isValid = await this.spellingService.isValidWord(guessTrimmed);
          if (!isValid) {
            return res.status(400).json({ error: `"${guessTrimmed}" is not a valid Nepali word` });
          }

          const targetUnits = this.feedbackEngine.tokenize(targetWord);
          const feedback    = this.feedbackEngine.compute(guessUnits, targetUnits);

          const isCorrect = guessTrimmed === targetWord;
          const gameOver  = isCorrect || (parseInt(attemptNumber, 10) >= 6);

          return res.json({
            feedback,
            isCorrect,
            gameOver,
            won: isCorrect,
            word: gameOver ? targetWord : null,
          });
        } catch (jwtErr) {
          return res.status(401).json({ error: 'Invalid or expired practice session' });
        }
      }

      // Daily challenge guess
      if (!req.user) {
        return res.status(401).json({ error: 'Sign in to play! Your streak awaits 🔥' });
      }

      const todayNPT = this._getTodayNPT();
      const result   = await this.submitGuessUseCase.execute({
        userId:    req.user.userId,
        date:      todayNPT,
        guessText: guessTrimmed,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  _getTodayNPT() {
    const now   = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const nptMs = utcMs + (5 * 60 + 45) * 60000;
    return new Date(nptMs).toISOString().slice(0, 10);
  }
}

module.exports = GameController;
