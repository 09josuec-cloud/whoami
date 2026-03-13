import Link from "next/link";

// ── SVG icons ────────────────────────────────────────────────────────────────

function WalletIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <WalletIcon />,
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/20",
    iconColor: "text-emerald-400",
    title: "Budget & Finance",
    description: "Connect your bank accounts, track spending by category, set budgets, and watch your savings goals grow — all in real time.",
  },
  {
    icon: <BookIcon />,
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/20",
    iconColor: "text-violet-400",
    title: "Private Journal",
    description: "Write freely with a rich text editor. PIN-lock sensitive entries, track your mood over time, and build a streak you're proud of.",
  },
  {
    icon: <CalendarIcon />,
    color: "from-blue-500/20 to-indigo-500/20 border-blue-500/20",
    iconColor: "text-blue-400",
    title: "Smart Calendar",
    description: "Month, week, and day views with Google Calendar sync. Import iCal files and manage everything from one clean interface.",
  },
  {
    icon: <DocumentIcon />,
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/20",
    iconColor: "text-amber-400",
    title: "Notes",
    description: "Capture thoughts, ideas, and plans as color-coded cards. Pin what matters, search instantly, and organize with tags.",
  },
  {
    icon: <BellIcon />,
    color: "from-rose-500/20 to-pink-500/20 border-rose-500/20",
    iconColor: "text-rose-400",
    title: "Reminders",
    description: "Never drop the ball. Set one-time or recurring reminders grouped by date — overdue, today, this week, and beyond.",
  },
  {
    icon: <SparklesIcon />,
    color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/20",
    iconColor: "text-indigo-400",
    title: "AI Assistant",
    description: "Ask questions about your finances, mood, or schedule. Create events, reminders, notes, and journal entries by just asking.",
  },
];

const security = [
  "Argon2id password hashing",
  "JWT sessions with httpOnly cookies",
  "Rate limiting on every route",
  "Content Security Policy headers",
  "Full audit logging",
  "Zero third-party trackers",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100">

      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: "60%",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "-10%",
            width: "40%",
            height: "40%",
            background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-[#09090b]/80 px-6 py-4 backdrop-blur-md md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-600" />
            <span className="relative text-sm font-bold text-white">W</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">whoami</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
          >
            Get started
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 flex-col">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center px-6 pb-20 pt-24 text-center md:pt-32">

          {/* Eyebrow badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
            Everything you need. Nothing you don't.
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Your life,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              one place.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            whoami is a private, secure platform that replaces the chaos of scattered apps.
            Your budget, journal, calendar, notes, and AI assistant — unified and always in sync.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02]"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-3.5 text-base font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              Sign in
            </Link>
          </div>

          {/* Subtle trust line */}
          <p className="mt-6 text-xs text-zinc-600">
            No credit card required · Private by default · Your data stays yours
          </p>
        </section>

        {/* ── Feature grid ────────────────────────────────────────────────── */}
        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-5xl">

            {/* Section label */}
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Everything built in</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
                One platform. Six modules.
              </h2>
              <p className="mt-3 text-sm text-zinc-500">Each module is complete on its own. Together, they replace your entire productivity stack.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className={[
                    "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-xl",
                    f.color,
                  ].join(" ")}
                >
                  {/* Subtle inner glow on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 60%)" }}
                  />

                  <div className={["mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]", f.iconColor].join(" ")}>
                    {f.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-100">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Analytics callout ────────────────────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-white/[0.02] px-6 py-16 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
              {/* Left: text */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                  <ChartIcon />
                  Personal analytics
                </div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-100">
                  Insights across your entire life
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">
                  whoami tracks patterns across all your modules — spending trends, mood over time, journal streaks, savings progress — and surfaces them in one analytics dashboard so you always know where you stand.
                </p>
              </div>

              {/* Right: stat pills */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                {[
                  { label: "Modules", value: "6" },
                  { label: "Categories tracked", value: "14" },
                  { label: "AI tools", value: "4" },
                  { label: "Data stays yours", value: "100%" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111114] px-6 py-5 text-center">
                    <span className="text-3xl font-bold tracking-tight text-zinc-100">{s.value}</span>
                    <span className="mt-1 text-xs text-zinc-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Security section ─────────────────────────────────────────────── */}
        <section className="px-6 py-20 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">

              {/* Left: heading */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <ShieldIcon />
                  Security first
                </div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-100">
                  Built like a vault,<br />not an afterthought.
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Every decision in whoami starts with security. Your data is encrypted, your sessions are locked down, and nothing leaves your control.
                </p>
              </div>

              {/* Right: checklist */}
              <div className="flex-1 space-y-3">
                {security.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <span className="text-emerald-400 shrink-0"><CheckIcon /></span>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="px-6 pb-24 md:px-12">
          <div className="mx-auto max-w-2xl">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-12 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(30,27,75,0.6) 0%, #111114 50%, rgba(46,16,101,0.4) 100%)",
              }}
            >
              {/* Orb */}
              <div
                className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-40"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.8), transparent 70%)", filter: "blur(30px)" }}
                aria-hidden="true"
              />

              <div className="relative">
                <h2 className="mb-3 text-3xl font-bold tracking-tight text-zinc-100">
                  Ready to get organized?
                </h2>
                <p className="mb-8 text-sm text-zinc-400">
                  Set up takes under 2 minutes. No cards, no subscriptions, no nonsense.
                </p>
                <Link
                  href="/register"
                  className="inline-block rounded-xl bg-indigo-600 px-10 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02]"
                >
                  Create your account
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-600" />
              <span className="relative text-[10px] font-bold text-white">W</span>
            </div>
            <span className="text-sm font-semibold text-zinc-400">whoami</span>
          </div>
          <p className="text-xs text-zinc-700">
            &copy; {new Date().getFullYear()} whoami. Your data. Your rules.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-700">
            <Link href="/login" className="hover:text-zinc-400 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-zinc-400 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
