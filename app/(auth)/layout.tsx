import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { template: "%s | Whoami", default: "Whoami" },
};

const features = [
  { label: "Bank-grade security" },
  { label: "AI-powered insights" },
  { label: "Everything in sync" },
  { label: "Private by default" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div className="relative hidden md:flex md:w-[40%] flex-col overflow-hidden">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(30,27,75,0.6) 0%, #09090b 50%, rgba(46,16,101,0.35) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Decorative blur orbs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.7), transparent 70%)",
            filter: "blur(40px)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.7), transparent 70%)",
            filter: "blur(50px)",
          }}
          aria-hidden="true"
        />
        {/* Second mid-panel orb for depth */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/3 h-48 w-48 -translate-y-1/2 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%)",
            filter: "blur(60px)",
          }}
          aria-hidden="true"
        />

        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        {/* Content layer */}
        <div className="relative z-10 flex flex-1 flex-col px-10 py-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <span className="text-sm font-bold text-white">W</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-100">
              whoami
            </span>
          </Link>

          {/* Center content */}
          <div className="flex flex-1 flex-col justify-center">
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-2">
              <div className="h-px w-8 bg-indigo-500/60" />
              <span className="text-xs font-medium uppercase tracking-widest text-indigo-400/80">
                Personal OS
              </span>
            </div>

            {/* Tagline */}
            <h2 className="mb-5 text-4xl font-bold leading-[1.15] tracking-tight text-zinc-100">
              Your life,
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                fully organized.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mb-10 max-w-xs text-sm leading-relaxed text-zinc-400">
              One secure space for your finances, journal, calendar, and
              everything in between.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {features.map(({ label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span className="text-xs font-medium text-zinc-300">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom decorative dots */}
          <div className="flex items-center gap-3 pb-2" aria-hidden="true">
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-1 rounded-full"
                  style={{ background: i < 3 ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.1)" }}
                />
              ))}
            </div>
            <span className="text-[11px] text-zinc-600">
              End-to-end encrypted
            </span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10 md:px-12">
        {/* Mobile logo (shown only on small screens) */}
        <div className="mb-10 flex items-center gap-2.5 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-100">
            whoami
          </span>
        </div>

        {/* Subtle top-right glow on form side */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-10"
          style={{
            background: "radial-gradient(circle at top right, rgba(99,102,241,0.8), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-sm">
          {children}
        </div>

        {/* Copyright + legal links */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 px-6">
          <p className="text-[11px] text-zinc-700">© {new Date().getFullYear()} whoami.company</p>
          <span className="text-zinc-800">·</span>
          <Link href="/terms" className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors">Terms</Link>
          <span className="text-zinc-800">·</span>
          <Link href="/privacy" className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
