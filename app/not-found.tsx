'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-600" />
        <span className="relative text-base font-bold text-white">W</span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">404</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-3">Page not found</h1>
      <p className="text-sm text-zinc-500 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.08] transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
