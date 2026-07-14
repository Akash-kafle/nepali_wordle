// =============================================================
// Infrastructure: DailyWordScheduler  (FR-3)
// Runs at 00:00 NPT (UTC+5:45 = 18:15 UTC previous day)
// node-cron cron expression: minute hour * * *
// 18:15 UTC = "15 18 * * *"
// =============================================================

const cron = require('node-cron');

class DailyWordScheduler {
  /**
   * @param {import('../../infrastructure/database/MySQLWordRepository')} wordRepo
   * @param {import('../../infrastructure/database/MySQLDailyChallengeRepository')} challengeRepo
   */
  constructor(wordRepo, challengeRepo) {
    this.wordRepo      = wordRepo;
    this.challengeRepo = challengeRepo;
  }

  start() {
    // Run at 18:15 UTC = 00:00 NPT
    cron.schedule('15 18 * * *', () => this._publishDailyWord(), {
      timezone: 'UTC',
    });

    console.log('[Scheduler] Daily word scheduler started. Runs at 18:15 UTC (00:00 NPT).');
  }

  async _publishDailyWord() {
    try {
      const todayNPT = this._getTodayNPT();
      console.log(`[Scheduler] Publishing word for ${todayNPT}`);

      // Check if today's challenge already exists (idempotent)
      const existing = await this.challengeRepo.findByDate(todayNPT);
      if (existing) {
        console.log(`[Scheduler] Challenge for ${todayNPT} already exists — skipping.`);
        return;
      }

      // Pick a word not used in the last 30 days
      const word = await this.wordRepo.findUnusedWord(30);
      if (!word) {
        console.error('[Scheduler] ERROR: No unused words available. Fallback: pick any word.');
        const fallback = await this.wordRepo.findRandom();
        if (!fallback) {
          console.error('[Scheduler] CRITICAL: Word list is empty!');
          return;
        }
        const fallbackDb = await this.wordRepo.ensureWordExists(fallback.wordText);
        await this.challengeRepo.create({ wordId: fallbackDb.wordId, challengeDate: todayNPT });
        console.log(`[Scheduler] Fallback word published: ${fallbackDb.wordText}`);
        return;
      }

      await this.challengeRepo.create({ wordId: word.wordId, challengeDate: todayNPT });
      console.log(`[Scheduler] Word published for ${todayNPT}: ${word.wordText}`);

    } catch (err) {
      // NFR-8: scheduler failure must not be silent
      console.error('[Scheduler] FAILED to publish daily word:', err.message);
      // In production, this is where you'd send an alert (email/Slack/PagerDuty)
    }
  }

  _getTodayNPT() {
    // Nepal Standard Time = UTC + 5:45
    const now     = new Date();
    const utcMs   = now.getTime() + now.getTimezoneOffset() * 60000;
    const nptMs   = utcMs + (5 * 60 + 45) * 60000;
    const nptDate = new Date(nptMs);
    return nptDate.toISOString().slice(0, 10);
  }
}

module.exports = DailyWordScheduler;
