// =============================================================
// Tests: FeedbackEngine  (FR-5)
// =============================================================

const FeedbackEngine = require('../src/infrastructure/feedback/FeedbackEngine');

describe('FeedbackEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new FeedbackEngine();
  });

  // ---- tokenize ----
  describe('tokenize', () => {
    test('splits a 3-akshara word correctly', () => {
      // "नेपाल" has 3 aksharas: न + े  (ne), पा (paa), ल (la)
      // We use a simpler 3-char test for reliability
      const units = engine.tokenize('कखग');
      expect(units).toHaveLength(3);
    });

    test('handles empty string', () => {
      expect(engine.tokenize('')).toEqual([]);
    });

    test('handles null/undefined gracefully', () => {
      expect(engine.tokenize(null)).toEqual([]);
    });
  });

  // ---- compute ----
  describe('compute', () => {
    test('all green when guess equals target', () => {
      const target = ['क', 'ख', 'ग'];
      const guess  = ['क', 'ख', 'ग'];
      const fb     = engine.compute(guess, target);
      expect(fb.map(f => f.status)).toEqual(['green', 'green', 'green']);
    });

    test('all grey when no match', () => {
      const target = ['क', 'ख', 'ग'];
      const guess  = ['च', 'छ', 'ज'];
      const fb     = engine.compute(guess, target);
      expect(fb.map(f => f.status)).toEqual(['grey', 'grey', 'grey']);
    });

    test('yellow for correct unit in wrong position', () => {
      const target = ['क', 'ख', 'ग'];
      const guess  = ['ख', 'ग', 'क'];  // all present but shifted
      const fb     = engine.compute(guess, target);
      expect(fb.map(f => f.status)).toEqual(['yellow', 'yellow', 'yellow']);
    });

    test('duplicate handling — does not over-credit', () => {
      // target: ['क', 'ख', 'ग']
      // guess:  ['क', 'क', 'क']  — only first क should be green, rest grey
      const target = ['क', 'ख', 'ग'];
      const guess  = ['क', 'क', 'क'];
      const fb     = engine.compute(guess, target);
      expect(fb[0].status).toBe('green');  // exact match
      expect(fb[1].status).toBe('grey');   // already consumed by first
      expect(fb[2].status).toBe('grey');
    });

    test('mixed green + yellow + grey', () => {
      const target = ['क', 'ख', 'ग'];
      const guess  = ['क', 'ग', 'झ'];
      const fb     = engine.compute(guess, target);
      expect(fb[0].status).toBe('green');   // exact
      expect(fb[1].status).toBe('yellow');  // ग is in target but wrong pos
      expect(fb[2].status).toBe('grey');    // झ not in target
    });

    test('blue for correct consonant but wrong vowel in same position', () => {
      // target: ['कि', 'ता', 'ब']
      // guess:  ['क', 'पा', 'ल']
      // Index 0: 'क' vs 'कि' -> bases match ('क'), vowels differ -> blue
      const target = ['कि', 'ता', 'ब'];
      const guess  = ['क', 'पा', 'ल'];
      const fb     = engine.compute(guess, target);
      expect(fb[0].status).toBe('blue');
      expect(fb[1].status).toBe('grey'); // पा vs ता, base differs
      expect(fb[2].status).toBe('grey'); // ल vs ब, base differs
    });

    test('returns correct unit labels in result', () => {
      const target = ['क', 'ख', 'ग'];
      const guess  = ['क', 'ख', 'ग'];
      const fb     = engine.compute(guess, target);
      expect(fb.map(f => f.unit)).toEqual(['क', 'ख', 'ग']);
    });
  });
});
