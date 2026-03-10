import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notes",
};

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center rounded-2xl border border-zinc-800 bg-zinc-900/60 px-8 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl">
          📝
        </div>
        <span className="mb-3 inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
          Coming Soon — Phase 5
        </span>
        <h1 className="text-2xl font-semibold text-zinc-100">Notes Module</h1>
        <p className="mt-3 max-w-md text-zinc-500">
          Quick capture and organised notes with tags, search, and rich
          formatting. Your second brain, always at your side.
        </p>
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-left w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">
            Planned features
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            {[
              "Markdown support",
              "Tag-based organisation",
              "Full-text search",
              "Pin important notes",
              "Linked notes (backlinks)",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/dashboard"
          className="mt-8 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
