import Link from "next/link";

const features = [
  {
    icon: "💰",
    title: "Budget",
    description: "Track finances and hit savings goals",
  },
  {
    icon: "📖",
    title: "Journal",
    description: "Private, encrypted daily reflections",
  },
  {
    icon: "📅",
    title: "Calendar",
    description: "All your events in one clean view",
  },
  {
    icon: "📝",
    title: "Notes",
    description: "Capture ideas and organise thoughts",
  },
  {
    icon: "🔔",
    title: "Reminders",
    description: "Never miss anything important",
  },
  {
    icon: "✨",
    title: "AI Assistant",
    description: "Your personal co-pilot across all modules",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">
            Whoami
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
          Phase 1 — Now live
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-zinc-100 md:text-6xl lg:text-7xl">
          Your personal{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            operating system
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
          Whoami brings every corner of your life into one secure, private
          platform. Budget, journal, calendar, notes — all yours.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-700 px-8 py-3.5 text-base font-semibold text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mt-24 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-left backdrop-blur-sm"
            >
              <span className="text-2xl" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="mt-3 font-semibold text-zinc-100">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Security callout */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-600">
          {[
            "Argon2id password hashing",
            "JWT + httpOnly cookies",
            "Rate limiting on all auth routes",
            "Strict CSP headers",
            "Audit logging",
          ].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 px-6 py-6 text-center text-sm text-zinc-700">
        &copy; {new Date().getFullYear()} Whoami. Built with security first.
      </footer>
    </div>
  );
}
