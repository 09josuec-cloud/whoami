'use client';

import { useState, useEffect } from 'react';

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
  const [greeting, setGreeting] = useState('');

  // Run only on the client after hydration so we get the user's local timezone
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <span className="text-sm font-medium text-zinc-400">
      {greeting && <>{greeting}, </>}
      <span className="text-zinc-100 font-semibold">{firstName}</span>
    </span>
  );
}

export function DateBadge() {
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(formatDate());
  }, []);

  if (!date) return null;
  return (
    <span className="hidden sm:block text-xs bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1 text-zinc-500">
      {date}
    </span>
  );
}
