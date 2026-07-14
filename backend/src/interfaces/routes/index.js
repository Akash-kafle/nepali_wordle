// =============================================================
// Routes: Wires Express router to controllers
// This is the composition root — all dependencies are injected here
// =============================================================

const express = require('express');

// Infrastructure
const MySQLUserRepository          = require('../../infrastructure/database/MySQLUserRepository');
const MySQLWordRepository          = require('../../infrastructure/database/MySQLWordRepository');
const MySQLDailyChallengeRepository = require('../../infrastructure/database/MySQLDailyChallengeRepository');
const MySQLGuessAttemptRepository  = require('../../infrastructure/database/MySQLGuessAttemptRepository');
const MySQLLeaderboardRepository   = require('../../infrastructure/database/MySQLLeaderboardRepository');
const BcryptService                = require('../../infrastructure/auth/BcryptService');
const JwtService                   = require('../../infrastructure/auth/JwtService');
const FeedbackEngine               = require('../../infrastructure/feedback/FeedbackEngine');
const NspellSpellingService        = require('../../infrastructure/spelling/NspellSpellingService');
const EmailService                 = require('../../infrastructure/email/EmailService');

// Use cases
const RegisterUseCase              = require('../../application/auth/RegisterUseCase');
const LoginUseCase                 = require('../../application/auth/LoginUseCase');
const VerifyEmailUseCase           = require('../../application/auth/VerifyEmailUseCase');
const ResendVerificationUseCase    = require('../../application/auth/ResendVerificationUseCase');
const GetDailyWordUseCase          = require('../../application/game/GetDailyWordUseCase');
const SubmitGuessUseCase           = require('../../application/game/SubmitGuessUseCase');
const GetStatsUseCase              = require('../../application/stats/GetStatsUseCase');
const GetLeaderboardUseCase        = require('../../application/stats/GetLeaderboardUseCase');

// Controllers
const AuthController  = require('../controllers/AuthController');
const GameController  = require('../controllers/GameController');
const StatsController = require('../controllers/StatsController');

// Middleware
const { requireAuth, optionalAuth, requireVerified } = require('../middleware/authMiddleware');
const { authLimiter, emailLimiter } = require('../middleware/rateLimiter');

// ---- Instantiate infrastructure ----
const userRepo      = new MySQLUserRepository();
const wordRepo      = new MySQLWordRepository();
const challengeRepo = new MySQLDailyChallengeRepository();
const attemptRepo   = new MySQLGuessAttemptRepository();
const lbRepo        = new MySQLLeaderboardRepository();
const bcryptSvc     = new BcryptService();
const jwtSvc        = new JwtService();
const feedback      = new FeedbackEngine();
const spellingSvc   = new NspellSpellingService();
const emailSvc      = new EmailService();

// ---- Wire use cases ----
const registerUC    = new RegisterUseCase(userRepo, bcryptSvc, jwtSvc, emailSvc);
const loginUC       = new LoginUseCase(userRepo, bcryptSvc, jwtSvc);
const verifyUC      = new VerifyEmailUseCase(userRepo);
const resendUC      = new ResendVerificationUseCase(userRepo, emailSvc);
const dailyUC       = new GetDailyWordUseCase(challengeRepo, attemptRepo);
const guessUC       = new SubmitGuessUseCase(challengeRepo, attemptRepo, feedback, lbRepo, spellingSvc);
const statsUC       = new GetStatsUseCase(lbRepo);
const leaderUC      = new GetLeaderboardUseCase(lbRepo);

// ---- Wire controllers ----
const authCtrl  = new AuthController(registerUC, loginUC, verifyUC, resendUC);
const gameCtrl  = new GameController(dailyUC, guessUC, wordRepo, jwtSvc, feedback, spellingSvc);
const statsCtrl = new StatsController(statsUC, leaderUC);

// ---- Build router ----
const router = express.Router();

// Auth routes
router.post('/auth/register',            authLimiter,  authCtrl.register);
router.post('/auth/login',               authLimiter,  authCtrl.login);
router.get('/auth/me',                   requireAuth,  authCtrl.me);
router.get('/auth/verify',                             authCtrl.verifyEmail);
router.post('/auth/resend-verification', requireAuth, emailLimiter, authCtrl.resendVerification);

// Game routes
router.get('/game/daily',     optionalAuth, gameCtrl.getDaily);
router.get('/game/practice',  optionalAuth, gameCtrl.getPractice);
router.post('/game/guess',    optionalAuth, gameCtrl.submitGuess);

// Stats routes (require verified email for personal stats)
router.get('/stats',          requireAuth, requireVerified, statsCtrl.getStats);
router.get('/leaderboard',    optionalAuth, statsCtrl.getLeaderboard);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = { router, wordRepo, challengeRepo };
