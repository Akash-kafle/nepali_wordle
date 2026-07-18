// =============================================================
// Infrastructure: EmailService (Gmail SMTP via Nodemailer)
// Sends verification emails with magic links
// =============================================================

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8888';
    this.fromAddress = process.env.SMTP_USER || 'noreply@nepaliwordgame.com';
  }

  /**
   * Resolves the SMTP host to an IPv4 address to prevent IPv6 connection failures
   * on environments like Railway.
   */
  async _getTransporter() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    let resolvedHost = smtpHost;
    let tlsConfig = {};

    // If it's a hostname (contains alphabetic characters), resolve to IPv4
    if (/[a-zA-Z]/.test(smtpHost)) {
      try {
        const dns = require('dns').promises;
        const addresses = await dns.resolve4(smtpHost);
        if (addresses && addresses.length > 0) {
          // Select a random IPv4 address
          resolvedHost = addresses[Math.floor(Math.random() * addresses.length)];
          tlsConfig = { servername: smtpHost };
          console.log(`[Email] Resolved host ${smtpHost} to IPv4: ${resolvedHost}`);
        }
      } catch (dnsErr) {
        console.warn(`[Email] DNS resolution failed for ${smtpHost}, falling back to original hostname:`, dnsErr.message);
      }
    }

    return nodemailer.createTransport({
      host:   resolvedHost,
      port:   smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: tlsConfig,
    });
  }

  /**
   * Send email verification link
   * @param {string} toEmail
   * @param {string} username
   * @param {string} verificationToken
   */
  async sendVerificationEmail(toEmail, username, verificationToken) {
    const verifyUrl = `${this.frontendUrl}/?verify=${verificationToken}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#0f1117;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#181c27;border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6c5ce7,#00b894);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">नेपाली शब्द खेल</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">NEPALI WORD GAME</p>
    </div>
    
    <!-- Body -->
    <div style="padding:32px 28px;">
      <h2 style="color:#f0f2ff;font-size:22px;margin:0 0 12px;">Verify Your Email ✉️</h2>
      <p style="color:#8892b0;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Welcome, <strong style="color:#f0f2ff;">${username}</strong>! Click the button below to verify your email address and start playing.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${verifyUrl}" 
           style="display:inline-block;background:#6c5ce7;color:#fff;text-decoration:none;padding:14px 40px;border-radius:14px;font-weight:600;font-size:16px;box-shadow:0 0 20px rgba(108,92,231,0.35);">
          Verify Email Address
        </a>
      </div>
      
      <p style="color:#4a5278;font-size:13px;line-height:1.5;margin:0 0 16px;">
        Or copy and paste this link into your browser:
      </p>
      <div style="background:#0f1117;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;word-break:break-all;">
        <a href="${verifyUrl}" style="color:#6c5ce7;font-size:13px;text-decoration:none;">${verifyUrl}</a>
      </div>
      
      <p style="color:#4a5278;font-size:12px;margin:24px 0 0;line-height:1.5;">
        This link expires in <strong style="color:#8892b0;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="padding:20px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:#4a5278;font-size:11px;margin:0;">
        © 2026 Nepali Word Game — Tribhuvan University / Texas International College
      </p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Verify Your Email — Nepali Word Game

Welcome, ${username}! Click the link below to verify your email address:

${verifyUrl}

This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
`;

    // 1. If RESEND_API_KEY is configured, use Resend's HTTPS API (bypasses Railway's outbound SMTP block)
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('[Email] Sending via Resend HTTPS API...');
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `"Nepali Word Game" <${fromEmail}>`,
            to: [toEmail],
            subject: '✉️ Verify your email — Nepali Word Game',
            html: htmlContent,
            text: textContent,
          }),
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.message || `HTTP ${response.status}`);
        }
        console.log(`[Email] Verification email sent to ${toEmail} via Resend. ID: ${resData.id}`);
        return;
      } catch (err) {
        console.error(`[Email] Failed to send verification email to ${toEmail} via Resend:`, err.message);
        // Fallback to SMTP
      }
    }

    // 2. Fallback to standard SMTP
    try {
      const transporter = await this._getTransporter();
      await transporter.sendMail({
        from:    `"Nepali Word Game" <${this.fromAddress}>`,
        to:      toEmail,
        subject: '✉️ Verify your email — Nepali Word Game',
        text:    textContent,
        html:    htmlContent,
      });
      console.log(`[Email] Verification email sent to ${toEmail}`);
    } catch (err) {
      console.error(`[Email] Failed to send verification email to ${toEmail}:`, err.message);
      // Don't throw — email failure shouldn't block registration
      // The user can use "Resend" later
    }
  }
}

module.exports = EmailService;
