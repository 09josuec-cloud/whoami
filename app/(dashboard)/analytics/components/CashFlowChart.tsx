'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface CashFlowMonth {
  month: string;
  income: number;
  spending: number;
  net: number;
}

function formatDollar(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  const hasData = data.some((d) => d.income > 0 || d.spending > 0);

  const latestMonth = data.at(-1);
  const netPositive = (latestMonth?.net ?? 0) >= 0;

  return (
    <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Cash Flow</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Income vs spending over 6 months</p>
        </div>
        {latestMonth && hasData && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-500">This month net</span>
            <span className={`font-semibold tabular-nums ${netPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netPositive ? '+' : ''}{fmt(latestMonth.net)}
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex h-64 items-center justify-center text-zinc-500 text-sm">
          No transaction data yet
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.split(' ')[0] ?? v}
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
                  backgroundColor: '#111114',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: 12,
                }}
                formatter={(value, name) => [fmt(Number(value ?? 0)), name as string]}
                cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#incomeGrad)"
                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
              <Area
                type="monotone"
                dataKey="spending"
                name="Spending"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#spendingGrad)"
                dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#f43f5e' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
