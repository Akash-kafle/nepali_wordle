// =============================================================
// Use Case: ResendVerificationUseCase
// Generates a new verification token + sends email
// =============================================================

const crypto = require('crypto');

class ResendVerificationUseCase {
  /**
   * @param {import('../../domain/repositories/interfaces').IUserRepository} userRepo
   * @param {import('../../infrastructure/email/EmailService')} emailService
   */
  constructor(userRepo, emailService) {
    this.userRepo     = userRepo;
    this.emailService = emailService;
  }

  /**
   * @param {{ userId: number }} dto
   * @returns {Promise<{ message: string }>}
   */
  async execute({ userId }) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    if (user.isVerified) {
      return { message: 'Email is already verified.' };
    }

    // Rate-limit: don't allow resend if last token was generated less than 60 seconds ago
    if (user.verificationExpires) {
      const tokenAge = (24 * 60 * 60 * 1000) - (new Date(user.verificationExpires).getTime() - Date.now());
      if (tokenAge < 60 * 1000) {
        throw Object.assign(
          new Error('Please wait at least 60 seconds before requesting a new verification email.'),
          { statusCode: 429 }
        );
      }
    }

    // Generate new token
    const verificationToken   = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userRepo.updateVerification(userId, {
      isVerified:          false,
      verificationToken,
      verificationExpires,
    });

    // Send email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.username,
      verificationToken
    );

    return { message: 'Verification email sent! Check your inbox.' };
  }
}

module.exports = ResendVerificationUseCase;
