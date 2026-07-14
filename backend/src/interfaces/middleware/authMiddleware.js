// =============================================================
// Middleware: JWT Auth + Verification checks
// =============================================================

const JwtService = require('../../infrastructure/auth/JwtService');
const MySQLUserRepository = require('../../infrastructure/database/MySQLUserRepository');

const jwtService = new JwtService();
const userRepo   = new MySQLUserRepository();

/**
 * Requires a valid Bearer token.
 * Sets req.user = { userId, email, isVerified }
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token   = header.slice(7);
    const payload = jwtService.verify(token);
    
    // Verify user exists in the database
    const user = await userRepo.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed: User no longer exists' });
    }

    req.user = {
      userId:     payload.userId,
      email:      payload.email,
      isVerified: user.isVerified,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optionally attaches user if token is present — does not block guests.
 */
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token   = header.slice(7);
      const payload = jwtService.verify(token);
      
      const user = await userRepo.findById(payload.userId);
      if (user) {
        req.user = {
          userId:     payload.userId,
          email:      payload.email,
          isVerified: user.isVerified,
        };
      }
    }
  } catch {
    // invalid token — treat as guest
  }
  next();
}

/**
 * Requires the user's email to be verified.
 * Must be used AFTER requireAuth.
 */
function requireVerified(req, res, next) {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      error: 'Please verify your email address to access this feature.',
      code:  'EMAIL_NOT_VERIFIED',
    });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireVerified };
