// =============================================================
// Use Case: VerifyEmailUseCase
// Handles verification link clicks — validates token + marks verified
// =============================================================

class VerifyEmailUseCase {
  /**
   * @param {import('../../domain/repositories/interfaces').IUserRepository} userRepo
   */
  constructor(userRepo) {
    this.userRepo = userRepo;
  }

  /**
   * @param {{ token: string }} dto
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async execute({ token }) {
    if (!token || typeof token !== 'string' || token.length < 10) {
      throw Object.assign(new Error('Invalid verification token'), { statusCode: 400 });
    }

    const user = await this.userRepo.findByVerificationToken(token);

    if (!user) {
      throw Object.assign(
        new Error('Invalid or expired verification link. Please request a new one.'),
        { statusCode: 400 }
      );
    }

    if (user.isVerified) {
      return { success: true, message: 'Email already verified. You can sign in.' };
    }

    // Check token expiry
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      throw Object.assign(
        new Error('Verification link has expired. Please request a new one.'),
        { statusCode: 410 }
      );
    }

    // Mark as verified, clear token
    await this.userRepo.updateVerification(user.userId, {
      isVerified:          true,
      verificationToken:   null,
      verificationExpires: null,
    });

    return { success: true, message: 'Email verified successfully! You can now play.' };
  }
}

module.exports = VerifyEmailUseCase;
