'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse at center, rgba(239,68,68,0.05) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-600" />
        <span className="relative text-base font-bold text-white">W</span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-3">Something went wrong</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-3">Unexpected error</h1>
      <p className="text-sm text-zinc-500 mb-8 max-w-sm">
        An unexpected error occurred. If this keeps happening, please contact support.
      </p>

      {error.digest && (
        <p className="mb-6 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-xs text-zinc-600">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.08] transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
