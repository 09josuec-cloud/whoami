'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MoodDataPoint {
  date: string;
  mood: number;
}

interface MoodChartProps {
  data: MoodDataPoint[];
  avgMood: number | null;
  bestDay: string | null;
  worstDay: string | null;
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

function moodTickFormatter(value: number): string {
  return MOOD_LABELS[value] ?? String(value);
}

export default function MoodChart({ data, avgMood, bestDay, worstDay }: MoodChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-100">Mood Trends</h2>
        {hasData && (
          <div className="flex gap-4 text-xs text-zinc-500">
            {avgMood !== null && (
              <span>
                Avg: <span className="text-amber-400 font-medium">{avgMood.toFixed(1)}</span>
              </span>
            )}
            {bestDay && (
              <span>
                Best: <span className="text-emerald-400 font-medium">{bestDay}</span>
              </span>
            )}
            {worstDay && (
              <span>
                Worst: <span className="text-rose-400 font-medium">{worstDay}</span>
              </span>
            )}
          </div>
        )}
      </div>
      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-center text-zinc-500 text-sm px-4">
          No mood data yet. Add mood to your journal entries.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={moodTickFormatter}
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: 12,
                }}
                formatter={(value) => {
                  const v = Number(value ?? 0);
                  return [`${v} — ${MOOD_LABELS[Math.round(v)] ?? ''}`, 'Mood'];
                }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#818cf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
