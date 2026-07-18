// =============================================================
// Infrastructure: NspellSpellingService
// Wraps dictionary-ne and nspell to validate words (FR-4)
// =============================================================

const { getPool } = require('../database/pool');
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
    const normalized = word.normalize('NFC').trim();

    // 1. Check if the word is in the database words table (custom vocabulary)
    try {
      const pool = getPool();
      const [rows] = await pool.execute('SELECT word_id FROM words WHERE word_text = ?', [normalized]);
      if (rows.length > 0) {
        return true; // If it's a seed/vocab word, it is always valid!
      }
    } catch (dbErr) {
      console.warn('[Spelling] Database validation fallback failed:', dbErr.message);
    }

    // 2. Fallback to dictionary checking
    await initPromise;
    return spell.correct(normalized);
  }
}

module.exports = NspellSpellingService;
