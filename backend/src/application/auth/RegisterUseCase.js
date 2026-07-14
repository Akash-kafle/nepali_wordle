// =============================================================
// Use Case: RegisterUseCase  (FR-1)
// Creates user + sends email verification link
// =============================================================

const crypto = require('crypto');

class RegisterUseCase {
  /**
   * @param {import('../../domain/repositories/interfaces').IUserRepository} userRepo
   * @param {import('../services/IBcryptService')} bcryptService
   * @param {import('../services/IJwtService')} jwtService
   * @param {import('../../infrastructure/email/EmailService')} emailService
   */
  constructor(userRepo, bcryptService, jwtService, emailService) {
    this.userRepo      = userRepo;
    this.bcryptService = bcryptService;
    this.jwtService    = jwtService;
    this.emailService  = emailService;
  }

  /**
   * @param {{ email: string, password: string, username: string }} dto
   * @returns {Promise<{ token: string, user: object, message: string }>}
   */
  async execute({ email, password, username }) {
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });
    }

    // Validate password strength (min 8 chars)
    if (!password || password.length < 8) {
      throw Object.assign(new Error('Password must be at least 8 characters'), { statusCode: 400 });
    }

    // Validate username
    if (!username || username.trim().length < 2) {
      throw Object.assign(new Error('Username must be at least 2 characters'), { statusCode: 400 });
    }

    // Sanitize username — strip HTML
    const sanitizedUsername = username.trim().replace(/<[^>]*>/g, '');

    // Check email uniqueness
    const existing = await this.userRepo.findByEmail(email.toLowerCase());
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    // Hash password
    const passwordHash = await this.bcryptService.hash(password);

    // Generate verification token
    const verificationToken   = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await this.userRepo.create({
      email:               email.toLowerCase(),
      passwordHash,
      username:            sanitizedUsername,
      verificationToken,
      verificationExpires,
    });

    // Send verification email (non-blocking — failure doesn't block registration)
    this.emailService.sendVerificationEmail(
      user.email,
      user.username,
      verificationToken
    ).catch(err => {
      console.error('[RegisterUseCase] Email send failed:', err.message);
    });

    const token = this.jwtService.sign({ userId: user.userId, email: user.email });

    return {
      token,
      user: user.toPublic(),
      message: 'Account created! Please check your email to verify your account.',
    };
  }
}

module.exports = RegisterUseCase;
