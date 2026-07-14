const { getPool }      = require('./pool');
const Word             = require('../../domain/entities/Word');
const dictionaryModule = import('dictionary-ne');
const FeedbackEngine   = require('../../infrastructure/feedback/FeedbackEngine');

let words3 = [];
const initPromise = dictionaryModule.then((dictMod) => {
  const feedbackEngine = new FeedbackEngine();
  const dicText = dictMod.default.dic.toString('utf-8');
  const lines = dicText.split('\n');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const word = line.split('/')[0].trim();
    if (!word || !/^[\u0900-\u097F]+$/.test(word)) continue;

    const units = feedbackEngine.tokenize(word);
    if (units.length === 3) {
      words3.push(word);
    }
  }
});

class MySQLWordRepository {
  async init() {
    await initPromise;
  }

  async ensureWordExists(wordText) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT word_id, word_text, unit_count, added_at FROM words WHERE word_text = ?', [wordText]);
    if (rows.length > 0) {
      return this._mapRow(rows[0]);
    }
    const [result] = await pool.execute(
      'INSERT INTO words (word_text, unit_count) VALUES (?, 3)',
      [wordText]
    );
    return new Word({
      wordId:    result.insertId,
      wordText:  wordText,
      unitCount: 3,
      addedAt:   new Date()
    });
  }

  async findUnusedWord(excludeDays = 30) {
    await initPromise;
    if (words3.length === 0) return null;

    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT w.word_text FROM daily_challenges dc
       JOIN words w ON dc.word_id = w.word_id
       WHERE dc.challenge_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [excludeDays]
    );
    const usedTexts = new Set(rows.map(r => r.word_text));

    const available = words3.filter(w => !usedTexts.has(w));
    const candidates = available.length > 0 ? available : words3;

    const chosenText = candidates[Math.floor(Math.random() * candidates.length)];
    return this.ensureWordExists(chosenText);
  }

  async findRandom() {
    await initPromise;
    if (words3.length === 0) return null;

    const chosenText = words3[Math.floor(Math.random() * words3.length)];
    return new Word({
      wordId:    null,
      wordText:  chosenText,
      unitCount: 3,
      addedAt:   new Date()
    });
  }

  _mapRow(row) {
    return new Word({
      wordId:    row.word_id,
      wordText:  row.word_text,
      unitCount: row.unit_count,
      addedAt:   row.added_at,
    });
  }
}

module.exports = MySQLWordRepository;
