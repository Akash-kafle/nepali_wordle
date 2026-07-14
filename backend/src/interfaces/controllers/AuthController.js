// =============================================================
// Controller: AuthController
// =============================================================

class AuthController {
  constructor(registerUseCase, loginUseCase, verifyEmailUseCase, resendVerificationUseCase) {
    this.registerUseCase           = registerUseCase;
    this.loginUseCase              = loginUseCase;
    this.verifyEmailUseCase        = verifyEmailUseCase;
    this.resendVerificationUseCase = resendVerificationUseCase;
  }

  register = async (req, res, next) => {
    try {
      const { email, password, username } = req.body;
      const result = await this.registerUseCase.execute({ email, password, username });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUseCase.execute({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req, res) => {
    res.json({ user: req.user });
  };

  verifyEmail = async (req, res, next) => {
    try {
      const { token } = req.query;
      const result = await this.verifyEmailUseCase.execute({ token });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  resendVerification = async (req, res, next) => {
    try {
      const result = await this.resendVerificationUseCase.execute({ userId: req.user.userId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = AuthController;
