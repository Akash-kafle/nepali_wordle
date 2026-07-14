// =============================================================
// Infrastructure: NspellSpellingService
// Wraps dictionary-ne and nspell to validate words (FR-4)
// =============================================================

const dictionaryModule = import('dictionary-ne');
const nspellModule     = import('nspell');

let spell = null;
const initPromise = Promise.all([dictionaryModule, nspellModule]).then(([dictMod, nspellMod]) => {
  const nspell = nspellMod.default;
  spell = nspell(dictMod.default);
});

class NspellSpellingService {
  async isValidWord(word) {
    if (!word) return false;
    await initPromise;
    return spell.correct(word.normalize('NFC').trim());
  }
}

module.exports = NspellSpellingService;
