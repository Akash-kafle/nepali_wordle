// =============================================================
// FeedbackEngine  (FR-5)
// Two-pass Wordle-style algorithm for Devanagari aksharas
//
// An "akshara" (syllable cluster) is defined as:
//   base consonant/vowel + zero or more combining marks
//   We use Unicode Segmentation rules for Devanagari grapheme clusters.
//
// Unicode Devanagari ranges used:
//   Consonants:  U+0915–U+0939, U+0958–U+095F
//   Vowels:      U+0905–U+0914
//   Matras:      U+093E–U+094F, U+0955–U+0957
//   Nukta:       U+093C
//   Anusvara:    U+0902
//   Visarga:     U+0903
//   Chandrabindu:U+0901
//   Halant:      U+094D  (virama — joins consonants)
// =============================================================

class FeedbackEngine {
  /**
   * Tokenize a Devanagari string into akshara (grapheme cluster) units.
   * Uses Intl.Segmenter if available (Node 16+), else falls back to regex.
   *
   * @param {string} text
   * @returns {string[]}
   */
  tokenize(text) {
    if (!text) return [];

    // Remove zero-width non-joiner and joiner for normalization
    const normalized = text.normalize('NFC').replace(/[\u200C\u200D]/g, '');

    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('ne', { granularity: 'grapheme' });
      return [...segmenter.segment(normalized)].map(s => s.segment);
    }

    // Fallback: split on Devanagari grapheme cluster boundaries
    // A cluster = base char + any combining marks (matras, halant, nukta, etc.)
    const DEVANAGARI_CLUSTER = /[\u0900-\u097F][\u0900-\u097F]*/g;
    const clusters = [];
    let match;
    while ((match = DEVANAGARI_CLUSTER.exec(normalized)) !== null) {
      clusters.push(match[0]);
    }
    return clusters.length > 0 ? clusters : [...normalized];
  }

  /**
   * Separates an akshara into its base consonant cluster and combining vowel signs (matras).
   * @param {string} akshara
   * @returns {{base: string, vowel: string}}
   */
  parseAkshara(akshara) {
    if (!akshara) return { base: '', vowel: '' };

    // Combining matras, virama/halant, anusvara, visarga, and chandrabindu
    const MATRA_REGEX = /[\u0900-\u0903\u093C\u093E-\u094D\u0951-\u0957]/g;

    const matras = akshara.match(MATRA_REGEX) || [];
    const vowel  = matras.join('');
    const base   = akshara.replace(MATRA_REGEX, '');

    return { base, vowel };
  }

  /**
   * Compute color-coded feedback for a guess vs target.
   * Both guessUnits and targetUnits are akshara arrays of length 3.
   *
   * @param {string[]} guessUnits
   * @param {string[]} targetUnits
   * @returns {Array<{unit: string, status: 'green'|'blue'|'yellow'|'grey'}>}
   */
  compute(guessUnits, targetUnits) {
    const len     = targetUnits.length;
    const result  = new Array(len).fill(null).map((_, i) => ({
      unit:   guessUnits[i] || '',
      status: 'grey',
    }));

    // Track remaining target units after matches are consumed
    const remainingTarget = new Array(len).fill(null);

    // Pass 1: Mark exact matches (green) and partial matches (blue: consonant right, vowel wrong)
    for (let i = 0; i < len; i++) {
      if (guessUnits[i] === targetUnits[i]) {
        result[i].status = 'green';
      } else {
        const guessParsed  = this.parseAkshara(guessUnits[i]);
        const targetParsed = this.parseAkshara(targetUnits[i]);

        if (guessParsed.base === targetParsed.base && guessParsed.base !== '') {
          result[i].status = 'blue'; // Consonant right, vowel wrong at correct position
        } else {
          remainingTarget[i] = targetUnits[i];
        }
      }
    }

    // Pass 2: Mark yellow (present but wrong position), accounting for duplicates
    for (let i = 0; i < len; i++) {
      if (result[i].status === 'green' || result[i].status === 'blue') continue;

      const idx = remainingTarget.findIndex(t => t === guessUnits[i]);
      if (idx !== -1) {
        result[i].status   = 'yellow';
        remainingTarget[idx] = null; // consume so duplicates aren't over-credited
      }
    }

    return result;
  }
}

module.exports = FeedbackEngine;
