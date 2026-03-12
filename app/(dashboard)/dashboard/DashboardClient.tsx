'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface BankAccount {
  id: string;
  name: string;
  type: string;
  currentBalance: number | null;
  availableBalance: number | null;
}

interface Transaction {
  id: string;
  name: string;
  merchantName: string | null;
  amount: number;
  date: string;
  category: string | null;
  logoUrl: string | null;
}

interface Budget {
  category: string;
  amount: number;
}

interface CashflowEntry {
  label: string;
  income: number;
  spending: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  targetAmount: number;
  currentAmount: number;
}

interface DashboardData {
  accounts: BankAccount[];
  recentTxs: Transaction[];
  budgets: Budget[];
  spending: Record<string, number>;
  cashflow: CashflowEntry[];
  goals: SavingsGoal[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtFull(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtCompact(n: number) {
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  return fmtFull(n);
}

const categoryEmoji: Record<string, string> = {
  'Food & Dining': '🍽️',
  Shopping: '🛍️',
  Transportation: '🚗',
  Entertainment: '🎬',
  Subscriptions: '📱',
  'Bills & Utilities': '⚡',
  Healthcare: '💊',
  'Personal Care': '💆',
  Travel: '✈️',
  Education: '📚',
  'Home & Garden': '🏡',
  Income: '💰',
  Transfer: '↔️',
  Other: '📦',
};

const categoryColor: Record<string, string> = {
  'Food & Dining': '#f97316',
  Shopping: '#8b5cf6',
  Transportation: '#3b82f6',
  Entertainment: '#ec4899',
  Subscriptions: '#06b6d4',
  'Bills & Utilities': '#eab308',
  Healthcare: '#10b981',
  'Personal Care': '#f43f5e',
  Travel: '#6366f1',
  Education: '#14b8a6',
  'Home & Garden': '#84cc16',
  Other: '#71717a',
};

// Mini SVG ring gauge
function RingGauge({ pct, color, size = 36 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 1) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardClient({ firstName }: { firstName: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [accountsRes, txsRes, budgetsRes, cashflowRes, goalsRes] = await Promise.all([
        fetch('/api/plaid/accounts'),
        fetch(`/api/plaid/transactions?month=${month}&year=${year}`),
        fetch(`/api/budget?month=${month}&year=${year}`),
        fetch('/api/budget/cashflow'),
        fetch('/api/savings-goals'),
      ]);

      const accountsData = accountsRes.ok ? ((await accountsRes.json()) as { accounts: BankAccount[] }) : { accounts: [] };
      const txsData = txsRes.ok ? ((await txsRes.json()) as { transactions: Transaction[] }) : { transactions: [] };
      const budgetsData = budgetsRes.ok ? ((await budgetsRes.json()) as { budgets: Budget[] }) : { budgets: [] };
      const cashflowData = cashflowRes.ok ? ((await cashflowRes.json()) as { cashflow: CashflowEntry[] }) : { cashflow: [] };
      const goalsData = goalsRes.ok ? ((await goalsRes.json()) as { goals: SavingsGoal[] }) : { goals: [] };

      const spending: Record<string, number> = {};
      for (const tx of txsData.transactions) {
        if (tx.amount > 0 && tx.category && tx.category !== 'Transfer') {
          spending[tx.category] = (spending[tx.category] ?? 0) + tx.amount;
        }
      }

      setData({
        accounts: accountsData.accounts,
        recentTxs: txsData.transactions.slice(0, 6),
        budgets: budgetsData.budgets,
        spending,
        cashflow: cashflowData.cashflow,
        goals: goalsData.goals.slice(0, 3),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-1">
        <div className="h-32 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-52 animate-pulse rounded-2xl bg-zinc-900" />
          <div className="h-52 animate-pulse rounded-2xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  const accounts = data?.accounts ?? [];
  const netWorth = accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
  const cashflow = data?.cashflow ?? [];
  const currentCashflow = cashflow.at(-1);
  const prevCashflow = cashflow.at(-2);
  const monthlyIncome = currentCashflow?.income ?? 0;
  const monthlySpending = currentCashflow?.spending ?? 0;
  const netCash = monthlyIncome - monthlySpending;
  const prevNetWorth = accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0); // same for now
  const prevSpending = prevCashflow?.spending ?? 0;
  const spendingDelta = prevSpending > 0 ? ((monthlySpending - prevSpending) / prevSpending) * 100 : 0;

  const topSpending = Object.entries(data?.spending ?? {})
    .filter(([cat]) => cat !== 'Income' && cat !== 'Transfer')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const topSpendMax = topSpending[0]?.[1] ?? 1;

  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 pb-8">

      {/* ── Greeting ── */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-600">{monthName}</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-zinc-100">
            Good to see you, <span className="text-white">{firstName}</span>
          </h1>
        </div>
        <Link
          href="/budget"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Full report →
        </Link>
      </div>

      {/* ── Net Worth Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0f0f12] p-6">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Net Worth</p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-white">{fmt(netWorth)}</p>
          <p className="mt-2 text-xs text-zinc-500">Across {accounts.length} linked {accounts.length === 1 ? 'account' : 'accounts'}</p>
        </div>
      </div>

      {/* ── 3 Stat Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Income"
          value={fmt(monthlyIncome)}
          sub="this month"
          valueColor="text-emerald-400"
          trend={null}
        />
        <StatCard
          label="Spending"
          value={fmt(monthlySpending)}
          sub={prevSpending > 0 ? `${spendingDelta >= 0 ? '+' : ''}${spendingDelta.toFixed(0)}% vs last month` : 'this month'}
          valueColor="text-rose-400"
          trend={prevSpending > 0 ? spendingDelta : null}
          trendInvert
        />
        <StatCard
          label="Net Cash"
          value={fmt(Math.abs(netCash))}
          sub={netCash >= 0 ? 'surplus this month' : 'deficit this month'}
          valueColor={netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          trend={null}
        />
      </div>

      {/* ── Cash Flow + Accounts ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Cash Flow bars */}
        {cashflow.length > 0 && (
          <div className="col-span-2 rounded-2xl bg-[#0f0f12] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Cash Flow</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-300">Income vs Spending</p>
              </div>
              <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Details →</Link>
            </div>
            <div className="flex items-end gap-3 h-28">
              {cashflow.slice(-6).map((entry, idx, arr) => {
                const maxVal = Math.max(...arr.map((e) => Math.max(e.income, e.spending)), 1);
                const incomeH = (entry.income / maxVal) * 100;
                const spendH = (entry.spending / maxVal) * 100;
                const isLast = idx === arr.length - 1;
                return (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-1.5 group">
                    <div className="relative flex w-full items-end justify-center gap-0.5 h-20">
                      {/* Hover tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                        <div className="rounded-lg bg-zinc-800 px-2 py-1 text-[10px] whitespace-nowrap text-zinc-300">
                          <span className="text-emerald-400">{fmtCompact(entry.income)}</span>
                          <span className="text-zinc-600 mx-1">·</span>
                          <span className="text-rose-400">{fmtCompact(entry.spending)}</span>
                        </div>
                      </div>
                      <div
                        className={['flex-1 rounded-t-sm transition-all', isLast ? 'bg-emerald-500' : 'bg-emerald-500/40'].join(' ')}
                        style={{ height: `${incomeH}%` }}
                      />
                      <div
                        className={['flex-1 rounded-t-sm transition-all', isLast ? 'bg-rose-500' : 'bg-rose-500/40'].join(' ')}
                        style={{ height: `${spendH}%` }}
                      />
                    </div>
                    <p className={['text-[10px] truncate w-full text-center', isLast ? 'text-zinc-300 font-medium' : 'text-zinc-600'].join(' ')}>
                      {entry.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 border-t border-zinc-800/60 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="h-2 w-2 rounded-sm bg-emerald-500/60" />Income
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="h-2 w-2 rounded-sm bg-rose-500/60" />Spending
              </span>
            </div>
          </div>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <div className="rounded-2xl bg-[#0f0f12] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">Accounts</p>
            <div className="space-y-3">
              {accounts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-300">{a.name}</p>
                      <p className="text-[10px] capitalize text-zinc-600">{a.type}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-zinc-100 ml-2">
                    {a.currentBalance !== null ? fmtCompact(a.currentBalance) : '—'}
                  </p>
                </div>
              ))}
              {accounts.length > 4 && (
                <p className="text-[10px] text-zinc-600">+{accounts.length - 4} more accounts</p>
              )}
            </div>
          </div>
        )}

        {/* If no cashflow, span accounts full width */}
        {cashflow.length === 0 && accounts.length === 0 && (
          <div className="col-span-3 rounded-2xl bg-[#0f0f12] p-6 text-center">
            <p className="text-sm text-zinc-500">Connect a bank account to see your cash flow.</p>
            <Link href="/budget" className="mt-2 inline-block text-xs text-indigo-400 hover:text-indigo-300">
              Connect account →
            </Link>
          </div>
        )}
      </div>

      {/* ── Budget Health + Goals ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Budget Health — Monarch-style rows */}
        <div className="col-span-2 rounded-2xl bg-[#0f0f12] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Budget Health</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-300">{monthName}</p>
            </div>
            <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Manage →</Link>
          </div>

          {(data?.budgets ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-500">No budgets set yet.</p>
              <Link href="/budget" className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Set budgets →</Link>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] gap-3 px-1">
                <span />
                <span className="w-16 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Budget</span>
                <span className="w-16 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Actual</span>
                <span className="w-16 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Left</span>
              </div>
              <div className="space-y-1">
                {(data?.budgets ?? []).map((b) => {
                  const spent = data?.spending[b.category] ?? 0;
                  const remaining = b.amount - spent;
                  const pct = b.amount > 0 ? Math.min(spent / b.amount, 1) : 0;
                  const over = spent > b.amount;
                  const warn = pct >= 0.8 && !over;
                  const ringColor = over ? '#ef4444' : warn ? '#f59e0b' : '#6366f1';
                  return (
                    <div key={b.category} className="group rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-800/40">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <RingGauge pct={pct} color={ringColor} size={30} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-zinc-200">
                              {categoryEmoji[b.category] ?? '📦'} {b.category}
                            </p>
                            {over && <span className="text-[10px] font-medium text-rose-400">Over budget</span>}
                            {warn && !over && <span className="text-[10px] font-medium text-amber-400">Almost there</span>}
                          </div>
                        </div>
                        <span className="w-16 text-right text-xs text-zinc-500">{fmtCompact(b.amount)}</span>
                        <span className={['w-16 text-right text-xs font-medium', over ? 'text-rose-400' : 'text-zinc-300'].join(' ')}>
                          {fmtCompact(spent)}
                        </span>
                        <span className={['w-16 text-right text-xs font-semibold', over ? 'text-rose-400' : remaining < b.amount * 0.2 ? 'text-amber-400' : 'text-emerald-400'].join(' ')}>
                          {over ? `-${fmtCompact(Math.abs(remaining))}` : fmtCompact(remaining)}
                        </span>
                      </div>
                      {/* Thin progress bar */}
                      <div className="mt-2 ml-10 h-0.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: ringColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Goals */}
        <div className="rounded-2xl bg-[#0f0f12] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Goals</p>
            <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">All →</Link>
          </div>
          {(data?.goals ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-500">No goals yet.</p>
              <Link href="/budget" className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Add goal →</Link>
            </div>
          ) : (
            <div className="space-y-5">
              {(data?.goals ?? []).map((g) => {
                const pct = g.targetAmount > 0 ? Math.min(g.currentAmount / g.targetAmount, 1) : 0;
                const color = g.color ?? '#6366f1';
                return (
                  <div key={g.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {g.emoji && <span className="text-base leading-none">{g.emoji}</span>}
                        <p className="truncate text-xs font-medium text-zinc-300">{g.name}</p>
                      </div>
                      <span className="shrink-0 ml-1 text-xs font-semibold" style={{ color }}>
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: color }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
                      <span>{fmtCompact(g.currentAmount)}</span>
                      <span>{fmtCompact(g.targetAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Top Spending + Recent Transactions ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Top Spending */}
        {topSpending.length > 0 && (
          <div className="rounded-2xl bg-[#0f0f12] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Top Spending</p>
              <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Details →</Link>
            </div>
            <div className="space-y-3">
              {topSpending.map(([cat, amount]) => {
                const pct = (amount / topSpendMax) * 100;
                const color = categoryColor[cat] ?? '#6366f1';
                return (
                  <div key={cat}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>{categoryEmoji[cat] ?? '📦'}</span>
                        {cat}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200">{fmtCompact(amount)}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-[#0f0f12] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Recent</p>
            <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">All →</Link>
          </div>
          {(data?.recentTxs ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">No transactions this month.</p>
          ) : (
            <div className="space-y-0.5">
              {(data?.recentTxs ?? []).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-800/40">
                  {tx.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tx.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm">
                      {categoryEmoji[tx.category ?? ''] ?? '📦'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-200">{tx.merchantName ?? tx.name}</p>
                    <p className="text-[10px] text-zinc-600">
                      {tx.category ?? 'Other'} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <p className={['shrink-0 text-xs font-semibold', tx.amount < 0 ? 'text-emerald-400' : 'text-zinc-200'].join(' ')}>
                    {tx.amount < 0 ? '+' : ''}{fmtCompact(Math.abs(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function StatCard({
  label, value, sub, valueColor, trend, trendInvert = false,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor: string;
  trend: number | null;
  trendInvert?: boolean;
}) {
  const isPositive = trend !== null && (trendInvert ? trend <= 0 : trend >= 0);
  const isNegative = trend !== null && (trendInvert ? trend > 0 : trend < 0);

  return (
    <div className="rounded-2xl bg-[#0f0f12] p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{label}</p>
      <p className={['mt-2 text-2xl font-bold tracking-tight', valueColor].join(' ')}>{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {trend !== null && (
          <span className={['text-[10px] font-semibold', isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-zinc-500'].join(' ')}>
            {isPositive ? '↓' : '↑'} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        <p className="text-[10px] text-zinc-600">{sub}</p>
      </div>
    </div>
  );
}
