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

interface BudgetRow {
  category: string;
  budget: number;
  actual: number;
  over: boolean;
}

interface BudgetChartProps {
  data: BudgetRow[];
  month: number;
  year: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDollar(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

// Custom bar shape to color over-budget bars red
interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: BudgetRow;
  fill?: string;
}

function ActualBar(props: CustomBarProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload, fill } = props;
  const color = payload?.over ? '#f43f5e' : (fill ?? '#6366f1');
  return <rect x={x} y={y} width={width} height={Math.max(height, 0)} fill={color} rx={3} />;
}

export default function BudgetChart({ data, month, year }: BudgetChartProps) {
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Budget vs Actual — {monthLabel}
        </h2>
        <div className="flex h-64 items-center justify-center text-center text-zinc-500 text-sm px-4">
          Set up budgets in the Budget module to see comparisons.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">
        Budget vs Actual — {monthLabel}
      </h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
            barCategoryGap="30%"
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: '#71717a', fontSize: 10 }}
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
            <Bar dataKey="budget" name="Budget" fill="#3f3f46" radius={[3, 3, 0, 0]} />
            <Bar
              dataKey="actual"
              name="Actual"
              fill="#6366f1"
              radius={[3, 3, 0, 0]}
              shape={(props: object) => <ActualBar {...(props as CustomBarProps)} />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
