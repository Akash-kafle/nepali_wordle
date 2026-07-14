// =============================================================
// Use Case: LoginUseCase  (FR-2)
// =============================================================

class LoginUseCase {
  constructor(userRepo, bcryptService, jwtService) {
    this.userRepo      = userRepo;
    this.bcryptService = bcryptService;
    this.jwtService    = jwtService;
  }

  /**
   * @param {{ email: string, password: string }} dto
   * @returns {Promise<{ token: string, user: object }>}
   */
  async execute({ email, password }) {
    // Generic error to avoid revealing whether email exists (SRS FR-2 alternate flow)
    const genericError = Object.assign(
      new Error('Invalid email or password'),
      { statusCode: 401 }
    );

    if (!email || !password) throw genericError;

    const user = await this.userRepo.findByEmail(email.toLowerCase());
    if (!user) throw genericError;

    const valid = await this.bcryptService.compare(password, user.passwordHash);
    if (!valid) throw genericError;

    const token = this.jwtService.sign({ userId: user.userId, email: user.email });

    return { token, user: user.toPublic() };
  }
}

module.exports = LoginUseCase;
