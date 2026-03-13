import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | whoami',
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-3">Terms of Service</h1>
          <p className="text-sm text-zinc-500">Effective date: {effective}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">1. Agreement to Terms</h2>
            <p>By creating an account or using whoami ("the Service", "the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
            <p className="mt-2">whoami is a personal productivity and life management platform. It is provided as-is for personal use.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">2. Description of Service</h2>
            <p>whoami provides tools for personal financial tracking, journaling, calendar management, habit tracking, health metrics, notes, and an AI-powered assistant. The Service integrates with third-party providers including Plaid (bank data), Google Calendar, and Anthropic (AI).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">3. Your Account</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating an account. You are solely responsible for all activity that occurs under your account.</p>
            <p className="mt-2">You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this requirement.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">4. Your Data</h2>
            <p>You retain full ownership of all data you enter into whoami — including journal entries, notes, financial data, health metrics, and calendar events. We do not claim any rights to your personal data.</p>
            <p className="mt-2">You are responsible for the accuracy and legality of data you provide. You agree not to enter false, misleading, or unlawful information.</p>
            <p className="mt-2">You may delete your account and all associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">5. Third-Party Integrations</h2>
            <p>The Service connects to third-party services to provide certain features:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                ['Plaid', 'Used to connect bank accounts and retrieve transaction data. Your banking credentials are never stored by whoami. Plaid\'s terms apply at plaid.com/legal.'],
                ['Google Calendar', 'Used to sync calendar events via OAuth. You may disconnect at any time from Settings.'],
                ['Anthropic (Claude)', 'Used to power the AI assistant and generate weekly digest summaries. Your data is sent to Anthropic\'s API to generate responses. Anthropic\'s privacy policy applies.'],
                ['Twilio', 'Used to send SMS messages for PIN recovery. Your phone number is only used for this purpose.'],
                ['Resend', 'Used to send transactional emails. Your email address is only used for account-related communications.'],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span><span className="font-medium text-zinc-200">{name}:</span> {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Use the Service for any unlawful purpose',
                'Attempt to gain unauthorized access to any part of the Service',
                'Reverse engineer, decompile, or disassemble any part of the Service',
                'Use the Service in a way that could harm, disable, or impair it',
                'Share your account credentials with others',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">7. Security</h2>
            <p>We implement industry-standard security measures including Argon2id password hashing, HTTPS encryption, two-factor authentication, and rate limiting. However, no system is perfectly secure. You use the Service at your own risk.</p>
            <p className="mt-2">If you discover a security vulnerability, please report it to us immediately rather than exploiting it.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">8. Disclaimers</h2>
            <p className="uppercase text-xs font-semibold text-zinc-500 mb-2">The service is provided "as is" without warranties of any kind.</p>
            <p>whoami is a personal tool, not a financial advisor, therapist, or medical provider. Nothing in the Service constitutes financial, legal, medical, or professional advice. You are solely responsible for decisions made based on information in the app.</p>
            <p className="mt-2">We do not guarantee that the Service will be available at all times, error-free, or secure from all possible threats.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">9. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, whoami and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Service — including loss of data, unauthorized access to your data, or interruption of service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes by updating the effective date above. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">11. Governing Law</h2>
            <p>These Terms are governed by the laws of the United States. Any disputes shall be resolved in a court of competent jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">12. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:hello@whoami.company" className="text-indigo-400 hover:text-indigo-300 transition-colors">hello@whoami.company</a>.</p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} whoami.company. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs text-indigo-400">Terms of Service</Link>
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
