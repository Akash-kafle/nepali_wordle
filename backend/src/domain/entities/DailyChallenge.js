// =============================================================
// Domain Entity: DailyChallenge
// =============================================================

class DailyChallenge {
  constructor({ challengeId, wordId, wordText, challengeDate, createdAt }) {
    this.challengeId   = challengeId;
    this.wordId        = wordId;
    this.wordText      = wordText;
    this.challengeDate = challengeDate;
    this.createdAt     = createdAt || new Date();
  }
}

module.exports = DailyChallenge;
