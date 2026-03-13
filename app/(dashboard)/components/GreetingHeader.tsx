'use client';

import { useMemo } from 'react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function GreetingHeader({ firstName }: { firstName: string }) {
  // Computed once on client mount — uses the user's local timezone
  const greeting = useMemo(() => getGreeting(), []);
  const date = useMemo(() => formatDate(), []);

  return (
    <span className="text-sm font-medium text-zinc-400">
      {greeting},{' '}
      <span className="text-zinc-100 font-semibold">{firstName}</span>
    </span>
  );
}

export function DateBadge() {
  const date = useMemo(() => formatDate(), []);
  return (
    <span className="hidden sm:block text-xs bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1 text-zinc-500">
      {date}
    </span>
  );
}
