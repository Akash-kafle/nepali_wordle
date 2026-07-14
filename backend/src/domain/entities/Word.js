// =============================================================
// Domain Entity: Word
// =============================================================

class Word {
  constructor({ wordId, wordText, unitCount, addedAt }) {
    this.wordId    = wordId;
    this.wordText  = wordText;
    this.unitCount = unitCount || 3;
    this.addedAt   = addedAt || new Date();
  }
}

module.exports = Word;
