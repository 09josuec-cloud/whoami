'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CATEGORY_COLORS } from '@/src/lib/categories';

interface SpendingData {
  category: string;
  amount: number;
}

interface SpendingChartProps {
  data: SpendingData[];
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const entry = payload[0];
    if (!entry) return null;
    return (
      <div className="rounded-lg border border-white/[0.06] bg-[#111114] p-2.5 text-sm shadow-sm shadow-black/20">
        <p className="font-medium text-zinc-100">{entry.name}</p>
        <p className="text-zinc-400">
          ${Math.abs(entry.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

interface LegendPayloadEntry {
  color?: string;
  value?: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadEntry[];
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-2">
      {payload.map((entry, index) => (
        <li key={index} className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export default function SpendingChart({ data }: SpendingChartProps) {
  const chartData = data.filter((d) => d.amount > 0);
  const total = chartData.reduce((sum, d) => sum + d.amount, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-zinc-500">No spending data for this period</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={72}
            outerRadius={108}
            paddingAngle={2}
            dataKey="amount"
            nameKey="category"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.category] ?? '#6b7280'}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
        <p className="text-xs text-zinc-500">Total spent</p>
        <p className="text-xl font-bold text-zinc-100">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}
