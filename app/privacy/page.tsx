import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | whoami',
};

export default function PrivacyPage() {
  const effective = 'March 13, 2026';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <span className="text-xs font-bold text-white">W</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">whoami</span>
          </Link>
          <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Title */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Legal</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-3">Privacy Policy</h1>
          <p className="text-sm text-zinc-500">Effective date: {effective}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">Overview</h2>
            <p>whoami is built on the belief that your personal data belongs to you. We collect only what is necessary to run the Service, we never sell your data, and we give you full control over what you share.</p>
            <p className="mt-2">This Privacy Policy explains what data we collect, how we use it, and your rights regarding it.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">1. Data We Collect</h2>

            <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">Account Information</h3>
            <p>When you create an account, we collect your name, email address, and hashed password (we never store your raw password). Optionally, you may add a phone number for SMS-based PIN recovery.</p>

            <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">Financial Data (via Plaid)</h3>
            <p>If you connect a bank account, Plaid provides us with your account balances, transaction history, and account metadata. Your banking credentials (username and password) are entered directly into Plaid's secure interface — whoami never sees or stores them.</p>

            <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">Journal Entries</h3>
            <p>Journal content you write, including titles, body text, mood ratings, and tags. This is stored in our database and is never shared with third parties. You may optionally lock journal entries with a PIN.</p>

            <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">Notes</h3>
            <p>Notes you create, including title, content, tags, and color preferences. Individual notes may be PIN-locked by you.</p>

            <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">Calendar & Reminders</h3>
            <p>Events and reminders you create directly in the app. If you connect Google Calendar via OAuth, we sync your Google Calendar events. You may disconnect Google Calendar at any time from Settings.</p>

            <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">Health & Habit Data</h3>
            <p>Health metrics you manually enter (steps, sleep, weight, water intake, calories, heart rate) and habit tracking data you log. This data is stored only for your personal use.</p>

            <h3 className="text-sm font-semibold text-zinc-200 mt-5 mb-2">Usage Data</h3>
            <p>We log security-relevant events (login attempts, failed authentications, 2FA events) to an audit log for account security purposes. We do not use cookies for tracking or analytics.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">2. How We Use Your Data</h2>
            <ul className="space-y-2 list-none">
              {[
                ['Provide the Service', 'Your data is used to power the app\'s features — displaying your finances, journal, calendar, habits, and health data.'],
                ['AI Assistant & Digest', 'When you use the AI assistant or generate a weekly digest, relevant data (financial summaries, mood trends, habit completion, upcoming events) is sent to Anthropic\'s Claude API to generate responses. Only aggregated summaries are sent — not raw journal content.'],
                ['Email & SMS', 'Your email is used for account verification, password resets, PIN recovery, and the weekly digest. Your phone number (if provided) is used only for SMS PIN recovery codes.'],
                ['Security', 'We use your data to detect unauthorized access, enforce rate limits, and maintain audit logs for account security.'],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span><span className="font-medium text-zinc-200">{title}:</span> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">3. Data Sharing</h2>
            <p className="font-medium text-zinc-200 mb-2">We do not sell, rent, or trade your personal data.</p>
            <p>We share data only with the third-party services necessary to operate the app:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                ['Neon (PostgreSQL)', 'Hosts your data in a secure, encrypted PostgreSQL database.'],
                ['Vercel', 'Hosts and serves the application. Does not have access to your data.'],
                ['Plaid', 'Processes your bank connection. Governed by Plaid\'s own privacy policy.'],
                ['Anthropic', 'Processes AI requests. Data sent to Claude API is governed by Anthropic\'s privacy policy and is not used to train models.'],
                ['Resend', 'Delivers transactional emails (verifications, resets, digest).'],
                ['Twilio', 'Delivers SMS PIN recovery codes.'],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />
                  <span><span className="font-medium text-zinc-200">{name}:</span> {desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">We may disclose data if required by law, court order, or to protect the rights and safety of users or the public.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">4. Data Security</h2>
            <p>We take security seriously and implement multiple layers of protection:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'All data is transmitted over HTTPS/TLS',
                'Passwords are hashed with Argon2id (industry-leading algorithm)',
                'PINs are hashed with Argon2id and never stored in plaintext',
                'OTP codes for PIN recovery are hashed with SHA-256',
                'Two-factor authentication (TOTP) is available',
                'Rate limiting on all authentication endpoints',
                'Security headers: CSP, HSTS, X-Frame-Options, and more',
                'Audit logging on all security-relevant events',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. When you delete your account, all associated data is permanently deleted from our systems within 30 days. Some data may be retained in backups for up to 90 days.</p>
            <p className="mt-2">Financial transaction data fetched via Plaid is stored in our database for as long as your bank connection is active. You may disconnect your bank at any time from Settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">6. Your Rights</h2>
            <p>You have the following rights regarding your data:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                ['Access', 'You can view all your data directly within the app.'],
                ['Deletion', 'You can delete individual entries at any time, or request full account deletion.'],
                ['Portability', 'You can request an export of your data by contacting us.'],
                ['Correction', 'You can edit any data you\'ve entered at any time.'],
                ['Withdraw Consent', 'You can disconnect third-party integrations (bank, Google Calendar) at any time from Settings.'],
              ].map(([right, desc]) => (
                <li key={right} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span><span className="font-medium text-zinc-200">{right}:</span> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">7. Cookies</h2>
            <p>We use only a single session cookie to keep you logged in. We do not use tracking cookies, analytics cookies, or advertising cookies. We do not use any third-party tracking scripts.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">8. Children's Privacy</h2>
            <p>The Service is not directed to children under 18. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us with personal information, please contact us.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by updating the effective date above. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">10. Contact</h2>
            <p>Questions or concerns about this Privacy Policy or your data? Contact us at <a href="mailto:privacy@whoami.company" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@whoami.company</a>.</p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} whoami.company. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-xs text-indigo-400">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
