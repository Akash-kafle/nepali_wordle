// =============================================================
// Domain Entity: User
// Pure business object — no framework dependencies
// =============================================================

class User {
  constructor({ userId, email, passwordHash, username, isVerified, verificationToken, verificationExpires, createdAt }) {
    this.userId              = userId;
    this.email               = email;
    this.passwordHash        = passwordHash;
    this.username            = username;
    this.isVerified          = isVerified ?? false;
    this.verificationToken   = verificationToken || null;
    this.verificationExpires = verificationExpires || null;
    this.createdAt           = createdAt || new Date();
  }

  toPublic() {
    return {
      userId:     this.userId,
      email:      this.email,
      username:   this.username,
      isVerified: this.isVerified,
      createdAt:  this.createdAt,
    };
  }
}

module.exports = User;
