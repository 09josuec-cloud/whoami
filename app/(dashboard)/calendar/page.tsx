import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Calendar",
};

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center rounded-2xl border border-zinc-800 bg-zinc-900/60 px-8 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-3xl">
          📅
        </div>
        <span className="mb-3 inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
          Coming Soon — Phase 4
        </span>
        <h1 className="text-2xl font-semibold text-zinc-100">Calendar Module</h1>
        <p className="mt-3 max-w-md text-zinc-500">
          Manage events, appointments, and recurring schedules in one clean
          interface. Stay on top of every important moment.
        </p>
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-left w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">
            Planned features
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            {[
              "Month, week, and day views",
              "Recurring events",
              "Calendar integrations",
              "Event reminders",
              "Shared calendars",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
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
