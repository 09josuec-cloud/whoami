import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "whoami — Your Personal OS",
  description:
    "Budget, journal, calendar, notes, habits, and AI assistant — one private, secure platform that replaces the chaos of scattered apps.",
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const modules = [
  {
    icon: <WalletIcon />,
    gradient: "from-emerald-500/15 to-teal-500/15",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    title: "Budget & Finance",
    description:
      "Connect your bank via Plaid. Track spending across 14 categories, set monthly budgets, monitor savings goals, and watch your net worth grow.",
  },
  {
    icon: <BookIcon />,
    gradient: "from-violet-500/15 to-purple-500/15",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    title: "Private Journal",
    description:
      "Write freely with a rich text editor. PIN-lock sensitive entries, track mood over time, build streaks, and browse by date on a calendar view.",
  },
  {
    icon: <CalendarIcon />,
    gradient: "from-blue-500/15 to-indigo-500/15",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    title: "Smart Calendar",
    description:
      "Month, week, and day views. Google Calendar sync, iCal import, local events, and recurring reminders — all in one clean interface.",
  },
  {
    icon: <DocumentIcon />,
    gradient: "from-amber-500/15 to-orange-500/15",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    title: "Notes",
    description:
      "Capture thoughts as color-coded cards. PIN-lock sensitive notes, pin what matters most, search instantly, and organize with tags.",
  },
  {
    icon: <HeartIcon />,
    gradient: "from-rose-500/15 to-pink-500/15",
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    title: "Habits & Health",
    description:
      "Build streaks on daily and weekly habits. Log health metrics — steps, sleep, weight, water, calories, heart rate — and track trends over time.",
  },
  {
    icon: <SparklesIcon />,
    gradient: "from-indigo-500/15 to-violet-500/15",
    border: "border-indigo-500/20",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    title: "AI Assistant",
    description:
      "Ask Claude anything about your data. Create events, reminders, notes, and journal entries by just asking. Get a personalized weekly digest by email.",
  },
];

const security = [
  "Argon2id password hashing — the industry gold standard",
  "JWT sessions with httpOnly cookies",
  "Two-factor authentication (TOTP) with backup codes",
  "Rate limiting on all authentication endpoints",
  "Content Security Policy + 7 security headers",
  "Full audit logging on every sensitive action",
  "Zero third-party trackers or analytics scripts",
  "PIN-locked entries — never stored in plaintext",
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign up in under a minute. No credit card, no subscriptions. Just your email and a secure password.",
  },
  {
    number: "02",
    title: "Connect your data",
    description: "Link your bank account via Plaid, connect Google Calendar, and start filling in your journal and habits.",
  },
  {
    number: "03",
    title: "See the full picture",
    description: "Your analytics dashboard shows spending trends, mood patterns, habit streaks, and net worth — all in one place.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100">

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: "80%", height: "60%",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-10%",
          width: "50%", height: "40%",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "-5%",
          width: "30%", height: "30%",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-[#09090b]/80 px-6 py-4 backdrop-blur-md md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-600" />
            <span className="relative text-sm font-bold text-white">W</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">whoami</span>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">How it works</a>
          <a href="#security" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">Security</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
            Get started
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 flex-col">

        {/* ── Hero ── */}
        <section className="flex flex-col items-center px-6 pb-24 pt-24 text-center md:pt-36">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/[0.08] px-4 py-1.5 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" aria-hidden="true" />
            Your personal OS — finance, journal, calendar &amp; more
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight leading-[1.1] md:text-6xl lg:text-7xl">
            Know yourself.{" "}
            <br className="hidden sm:block" />
            <span style={{
              background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 45%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Own your life.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            One private, secure platform that replaces the chaos of scattered apps.
            Budget, journal, calendar, notes, habits, and AI — unified and always in sync.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-100"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-8 py-3.5 text-base font-semibold text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-all"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-xs text-zinc-600">
            No credit card · No subscriptions · Your data stays yours
          </p>

          {/* Stat bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-white/[0.05] pt-10">
            {[
              { value: "7", label: "modules" },
              { value: "60+", label: "API routes" },
              { value: "14", label: "spending categories" },
              { value: "100%", label: "private" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-bold tracking-tight text-zinc-100">{s.value}</span>
                <span className="text-xs text-zinc-600">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Modules ── */}
        <section id="features" className="px-6 pb-28 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Everything built in</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
                One platform. Seven modules.
              </h2>
              <p className="mt-3 max-w-lg mx-auto text-sm text-zinc-500">
                Each module works on its own. Together, they replace your entire personal productivity stack.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <div
                  key={m.title}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${m.gradient} ${m.border}`}
                >
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 60%)" }}
                  />
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${m.iconBg} ${m.iconColor}`}>
                    {m.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-100">{m.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{m.description}</p>
                </div>
              ))}

              {/* Weekly digest card */}
              <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:col-span-2 lg:col-span-1">
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 60%)" }}
                />
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <EnvelopeIcon />
                </div>
                <h3 className="mb-2 font-semibold text-zinc-100">Weekly Digest</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Every week, Claude summarizes your finances, mood, habits, and upcoming events into a beautiful personalized email — delivered on your schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="border-y border-white/[0.05] bg-white/[0.015] px-6 py-24 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Simple setup</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
                Up and running in minutes
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col">
                  <div className="mb-5 flex items-center gap-4">
                    <span
                      className="text-4xl font-black tracking-tighter"
                      style={{
                        background: "linear-gradient(135deg, #818cf8, #a78bfa)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {step.number}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-100">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Security ── */}
        <section id="security" className="px-6 py-24 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-start gap-12 md:flex-row md:gap-16">

              {/* Left */}
              <div className="flex-1">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-400">
                  <ShieldIcon />
                  Security first
                </div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-100 leading-tight">
                  Built like a vault,<br />not an afterthought.
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                  Every decision in whoami starts with security. Your data is encrypted, your sessions are locked down, and nothing leaves your control.
                </p>
                <p className="text-sm leading-relaxed text-zinc-500">
                  We use industry-leading cryptography, implement defense-in-depth, and maintain a full audit trail of every sensitive action — so you always know your data is safe.
                </p>
              </div>

              {/* Right: checklist */}
              <div className="flex-1 space-y-2.5">
                {security.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <span className="text-emerald-400 shrink-0"><CheckIcon /></span>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="px-6 pb-28 md:px-12">
          <div className="mx-auto max-w-2xl">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-12 text-center"
              style={{ background: "linear-gradient(135deg, rgba(30,27,75,0.7) 0%, #111114 50%, rgba(46,16,101,0.5) 100%)" }}
            >
              {/* Top orb */}
              <div
                className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-50"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.7), transparent 70%)", filter: "blur(40px)" }}
                aria-hidden="true"
              />
              {/* Bottom orb */}
              <div
                className="pointer-events-none absolute -bottom-16 right-8 h-32 w-32 rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, rgba(139,92,246,0.7), transparent 70%)", filter: "blur(30px)" }}
                aria-hidden="true"
              />

              <div className="relative">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Get started today</p>
                <h2 className="mb-3 text-3xl font-bold tracking-tight text-zinc-100">
                  Ready to know yourself?
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-zinc-400 max-w-sm mx-auto">
                  Set up takes under 2 minutes. No credit cards, no subscriptions. Just you and your data.
                </p>
                <Link
                  href="/register"
                  className="inline-block rounded-xl bg-indigo-600 px-10 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-100"
                >
                  Create your free account
                </Link>
                <p className="mt-4 text-xs text-zinc-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-10 md:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-600" />
                <span className="relative text-xs font-bold text-white">W</span>
              </div>
              <span className="text-sm font-semibold text-zinc-400">whoami</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-600">
              <Link href="/login" className="hover:text-zinc-400 transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-zinc-400 transition-colors">Register</Link>
              <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
              <Link href="/support" className="hover:text-zinc-400 transition-colors">Support</Link>
            </div>

            {/* Copyright */}
            <p className="text-xs text-zinc-700">
              © {new Date().getFullYear()} whoami.company
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
