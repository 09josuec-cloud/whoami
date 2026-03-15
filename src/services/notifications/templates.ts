const baseStyles = `
  body { margin: 0; padding: 0; background-color: #0f0f23; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background-color: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 12px; padding: 40px; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .logo-icon { width: 32px; height: 32px; background-color: #4f46e5; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
  .logo-text { color: #e2e8f0; font-size: 18px; font-weight: 600; letter-spacing: -0.025em; }
  h1 { color: #e2e8f0; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; }
  p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; }
  .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0 24px 0; }
  .button:hover { background-color: #4338ca; }
  .divider { border: none; border-top: 1px solid #2d2d4e; margin: 24px 0; }
  .footer { color: #64748b; font-size: 13px; text-align: center; margin-top: 32px; }
  .url-fallback { color: #6366f1; font-size: 13px; word-break: break-all; }
  .badge { display: inline-block; background-color: #1e1e3a; border: 1px solid #4f46e5; color: #818cf8; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 20px; }
`;

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-icon" style="color:#fff; font-size:14px; font-weight:700; text-align:center; line-height:32px;">W</span>
        <span class="logo-text">Whoami</span>
      </div>
      ${content}
      <hr class="divider" />
      <div class="footer">
        <p style="margin:0;">This email was sent by Whoami. If you didn&apos;t request this, you can safely ignore it.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function passwordResetTemplate(resetUrl: string): string {
  return emailWrapper(`
    <div class="badge">Password Reset</div>
    <h1>Reset your password</h1>
    <p>We received a request to reset the password for your Whoami account. Click the button below to choose a new password.</p>
    <p>This link expires in <strong style="color:#e2e8f0;">1 hour</strong>.</p>
    <a href="${resetUrl}" class="button">Reset password</a>
    <p>Or copy and paste this URL into your browser:</p>
    <p class="url-fallback">${resetUrl}</p>
    <p style="color:#64748b; font-size:13px;">If you didn&apos;t request a password reset, please ignore this email. Your password won&apos;t change.</p>
  `);
}

export function verifyEmailTemplate(verifyUrl: string): string {
  return emailWrapper(`
    <div class="badge">Verify your email</div>
    <h1>Confirm your email address</h1>
    <p>Thanks for signing up for Whoami! Please verify your email address to complete your registration.</p>
    <p>This link expires in <strong style="color:#e2e8f0;">24 hours</strong>.</p>
    <a href="${verifyUrl}" class="button">Verify email address</a>
    <p>Or copy and paste this URL into your browser:</p>
    <p class="url-fallback">${verifyUrl}</p>
  `);
}

export function newUserAdminTemplate(name: string, email: string): string {
  return emailWrapper(`
    <div class="badge">New Sign-up</div>
    <h1>New user joined Whoami</h1>
    <p>Someone just created an account on <strong style="color:#e2e8f0;">whoami.company</strong>.</p>
    <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
      <tr>
        <td style="color:#64748b; font-size:14px; padding: 6px 0; width:80px;">Name</td>
        <td style="color:#e2e8f0; font-size:14px; font-weight:600;">${name}</td>
      </tr>
      <tr>
        <td style="color:#64748b; font-size:14px; padding: 6px 0;">Email</td>
        <td style="color:#e2e8f0; font-size:14px; font-weight:600;">${email}</td>
      </tr>
    </table>
  `);
}

export function twoFactorEnabledTemplate(): string {
  return emailWrapper(`
    <div class="badge">Security Update</div>
    <h1>Two-factor authentication enabled</h1>
    <p>Two-factor authentication (2FA) has been successfully enabled on your Whoami account. Your account is now more secure.</p>
    <p>From now on, you&apos;ll need your authenticator app in addition to your password when signing in.</p>
    <p style="color:#64748b; font-size:13px;">If you didn&apos;t make this change, please contact support immediately and change your password.</p>
  `);
}
