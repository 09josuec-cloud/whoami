'use client';

interface OverviewData {
  totalSpentThisMonth: number;
  avgMoodThisMonth: number | null;
  journalEntriesThisMonth: number;
  netWorth: number;
  journalStreak: number;
  upcomingReminders: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent = 'text-zinc-100' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-zinc-500 text-xs">
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-500">{sub}</p>}
    </div>
  );
}

export default function OverviewCards({ data }: { data: OverviewData }) {
  const moodLabel =
    data.avgMoodThisMonth !== null
      ? `${data.avgMoodThisMonth.toFixed(1)} / 5`
      : 'No data';

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        icon="💸"
        label="Spent this month"
        value={fmt(data.totalSpentThisMonth)}
        sub="expenses only"
        accent="text-rose-400"
      />
      <StatCard
        icon="😊"
        label="Avg mood"
        value={moodLabel}
        sub="from journal entries"
        accent={data.avgMoodThisMonth !== null ? 'text-amber-400' : 'text-zinc-500'}
      />
      <StatCard
        icon="📖"
        label="Journal entries"
        value={String(data.journalEntriesThisMonth)}
        sub="this month"
        accent="text-violet-400"
      />
      <StatCard
        icon="💰"
        label="Net worth"
        value={fmt(data.netWorth)}
        sub="all accounts"
        accent="text-emerald-400"
      />
      <StatCard
        icon="🔥"
        label="Journal streak"
        value={`${data.journalStreak} day${data.journalStreak !== 1 ? 's' : ''}`}
        sub="consecutive days"
        accent={data.journalStreak > 0 ? 'text-orange-400' : 'text-zinc-500'}
      />
      <StatCard
        icon="⏰"
        label="Upcoming reminders"
        value={String(data.upcomingReminders)}
        sub="due in 7 days"
        accent={data.upcomingReminders > 0 ? 'text-sky-400' : 'text-zinc-500'}
      />
    </div>
  );
}
