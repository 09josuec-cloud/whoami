'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MonthRow {
  month: string;
  [category: string]: string | number;
}

interface SpendingChartProps {
  data: MonthRow[];
  categories: string[];
}

const CATEGORY_COLORS: string[] = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
];

function formatDollar(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

export default function SpendingChart({ data, categories }: SpendingChartProps) {
  const hasData = data.some((row) => categories.some((cat) => (row[cat] as number) > 0));

  return (
    <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">Spending by Category</h2>
      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-zinc-500 text-sm">
          No transaction data yet
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.split(' ')[0]}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatDollar}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: 12,
                }}
                formatter={(value, name) => [`$${Number(value ?? 0).toFixed(2)}`, name as string]}
                cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 8 }}
              />
              {categories.map((cat, i) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="a"
                  fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  radius={i === categories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
