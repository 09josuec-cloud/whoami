'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeekDataPoint {
  week: string;
  count: number;
}

interface JournalFrequencyChartProps {
  data: WeekDataPoint[];
  totalEntries: number;
  avgPerWeek: number;
  longestStreak: number;
}

export default function JournalFrequencyChart({
  data,
  totalEntries,
  avgPerWeek,
  longestStreak,
}: JournalFrequencyChartProps) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">Journal Activity</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => v.replace('Week of ', '')}
              interval={2}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#f4f4f5',
                fontSize: 12,
              }}
              formatter={(value) => [Number(value ?? 0), 'Entries']}
              labelFormatter={(label) => String(label)}
              cursor={{ fill: 'rgba(139,92,246,0.08)' }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!hasData && (
        <p className="mt-2 text-center text-sm text-zinc-500">No journal entries in the last 12 weeks.</p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-800 pt-4">
        <div className="text-center">
          <p className="text-lg font-bold text-violet-400">{totalEntries}</p>
          <p className="text-[11px] text-zinc-500">Total entries</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-violet-400">{avgPerWeek}</p>
          <p className="text-[11px] text-zinc-500">Avg / week</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-violet-400">{longestStreak}</p>
          <p className="text-[11px] text-zinc-500">Longest streak</p>
        </div>
      </div>
    </div>
  );
}
