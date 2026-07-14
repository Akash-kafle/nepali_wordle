// =============================================================
// Domain Entity: GuessAttempt
// =============================================================

class GuessAttempt {
  constructor({ attemptId, userId, challengeId, guessText, feedback, attemptNumber, isCorrect, submittedAt }) {
    this.attemptId     = attemptId;
    this.userId        = userId;
    this.challengeId   = challengeId;
    this.guessText     = guessText;
    this.feedback      = feedback;   // Array of { unit, status: 'green'|'yellow'|'grey' }
    this.attemptNumber = attemptNumber;
    this.isCorrect     = isCorrect || false;
    this.submittedAt   = submittedAt || new Date();
  }
}

module.exports = GuessAttempt;
