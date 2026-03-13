'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useState } from 'react';

export interface NetWorthSnapshot {
  date: string; // YYYY-MM-DD
  netWorth: number;
  assets: number;
  liabilities: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtShort(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtLabel(date: string, range: '30' | '90') {
  const d = new Date(date + 'T00:00:00');
  if (range === '30') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Range = '30' | '90';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: NetWorthSnapshot }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const date = new Date((label ?? '') + 'T00:00:00');
  const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-2 text-zinc-500">{dateLabel}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">Net Worth</span>
          <span className={`font-semibold tabular-nums ${d.netWorth >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            {fmt(d.netWorth)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-500">Assets</span>
          <span className="tabular-nums text-emerald-400">{fmt(d.assets)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-500">Liabilities</span>
          <span className="tabular-nums text-rose-400">{fmt(d.liabilities)}</span>
        </div>
      </div>
    </div>
  );
}

export default function NetWorthHistoryChart({ data }: { data: NetWorthSnapshot[] }) {
  const [range, setRange] = useState<Range>('30');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (range === '30' ? 29 : 89));
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

  const filtered = data.filter((d) => d.date >= cutoffStr);

  const hasData = filtered.length >= 2;
  const latest = filtered.at(-1);
  const earliest = filtered[0];
  const delta = latest && earliest ? latest.netWorth - earliest.netWorth : null;
  const deltaPositive = (delta ?? 0) >= 0;

  // Color the area based on whether net worth is positive or negative overall
  const allPositive = filtered.every((d) => d.netWorth >= 0);
  const areaColor = allPositive ? '#6366f1' : '#f43f5e';
  const gradId = allPositive ? 'nwGradPositive' : 'nwGradNegative';

  // Thin out X-axis ticks so they don't overlap
  const tickStep = range === '30' ? 5 : 14;
  const tickDates = new Set(
    filtered
      .filter((_, i) => i % tickStep === 0 || i === filtered.length - 1)
      .map((d) => d.date)
  );

  return (
    <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Net Worth History</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {hasData
              ? `Tracked daily from Plaid syncs`
              : 'Syncing builds your history over time'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {delta !== null && hasData && (
            <span className={`text-xs font-medium tabular-nums mr-2 ${deltaPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {deltaPositive ? '+' : ''}{fmt(delta)} this period
            </span>
          )}
          <div className="flex rounded-lg bg-white/[0.04] border border-white/[0.06] p-0.5 text-xs">
            {(['30', '90'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={[
                  'rounded-md px-2.5 py-1 transition-colors',
                  range === r
                    ? 'bg-[#1c1c1f] text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300',
                ].join(' ')}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
          <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          </div>
          <p className="text-sm text-zinc-400">No history yet</p>
          <p className="text-xs text-zinc-600 max-w-xs">
            Your first data point was captured today. Sync your accounts regularly to build a trend line.
          </p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => tickDates.has(v) ? fmtLabel(v, range) : ''}
                interval={0}
              />
              <YAxis
                tick={{ fill: '#52525b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtShort}
                width={52}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="netWorth"
                name="Net Worth"
                stroke={areaColor}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: areaColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
