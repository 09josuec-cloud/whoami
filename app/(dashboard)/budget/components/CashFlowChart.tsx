'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface CashFlowData {
  label: string;
  income: number;
  spending: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ name: string; value: number; color: string }>;
}

function CustomTooltip({ active, label, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.name === 'income')?.value ?? 0;
  const spending = payload.find((p) => p.name === 'spending')?.value ?? 0;
  const net = income - spending;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#111114] p-3 shadow-sm shadow-black/20 text-sm">
      <p className="mb-2 font-medium text-zinc-100">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-emerald-400">Income</span>
          <span className="font-semibold text-emerald-400">{fmt(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-red-400">Spending</span>
          <span className="font-semibold text-red-400">{fmt(spending)}</span>
        </div>
        <div className="border-t border-white/[0.06] pt-1 flex items-center justify-between gap-4">
          <span className="text-zinc-400">Net</span>
          <span className={['font-semibold', net >= 0 ? 'text-emerald-400' : 'text-red-400'].join(' ')}>
            {net >= 0 ? '+' : ''}{fmt(net)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;
  return (
    <ul className="flex justify-center gap-6 pt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          {entry.value.charAt(0).toUpperCase() + entry.value.slice(1)}
        </li>
      ))}
    </ul>
  );
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  if (data.every((d) => d.income === 0 && d.spending === 0)) {
    return (
      <div className="flex h-56 items-center justify-center">
        <p className="text-sm text-zinc-500">No cash flow data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend content={<CustomLegend />} />
        <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={40} />
        <Bar dataKey="spending" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
