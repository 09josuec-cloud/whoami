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

interface HabitToday {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  todayCompleted: boolean;
  currentStreak: number;
}

interface DashboardData {
  accounts: BankAccount[];
  recentTxs: Transaction[];
  budgets: Budget[];
  spending: Record<string, number>;
  cashflow: CashflowEntry[];
  goals: SavingsGoal[];
  habitsToday: { habits: HabitToday[]; completedCount: number; totalCount: number };
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

// SVG icon paths (Heroicons 2 outline)
const ICON_PATHS: Record<string, string> = {
  'Food & Dining': 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
  Shopping: 'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z',
  Transportation: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  Entertainment: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 19.5m9.75-14.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25',
  Subscriptions: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 20.25h3',
  'Bills & Utilities': 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  Healthcare: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  'Personal Care': 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
  Travel: 'M6 12 3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5',
  Education: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  'Home & Garden': 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  Income: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941',
  Transfer: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  Other: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
};

function CategoryIcon({ category, size = 16, className = '', color }: { category: string; size?: number; className?: string; color?: string }) {
  const path = ICON_PATHS[category] ?? ICON_PATHS.Other;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color ?? 'currentColor'} strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

// Mini SVG ring gauge
function RingGauge({ pct, color, size = 36 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 1) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
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

const LIABILITY_TYPES = ['credit', 'loan', 'mortgage'];

function calcNetWorth(accounts: BankAccount[]) {
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    const bal = a.currentBalance ?? 0;
    if (LIABILITY_TYPES.includes(a.type)) liabilities += bal;
    else assets += bal;
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}

export default function DashboardClient({ firstName }: { firstName: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNetWorth, setShowNetWorth] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('whoami_showNetWorth');
    if (saved === 'false') setShowNetWorth(false);
  }, []);

  const toggleNetWorth = () => {
    setShowNetWorth((v) => {
      localStorage.setItem('whoami_showNetWorth', String(!v));
      return !v;
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [accountsRes, txsRes, budgetsRes, cashflowRes, goalsRes, habitsRes] = await Promise.all([
        fetch('/api/plaid/accounts'),
        fetch(`/api/plaid/transactions?month=${month}&year=${year}`),
        fetch(`/api/budget?month=${month}&year=${year}`),
        fetch('/api/budget/cashflow'),
        fetch('/api/savings-goals'),
        fetch('/api/habits/today'),
      ]);

      const accountsData = accountsRes.ok ? ((await accountsRes.json()) as { accounts: BankAccount[] }) : { accounts: [] };
      const txsData = txsRes.ok ? ((await txsRes.json()) as { transactions: Transaction[] }) : { transactions: [] };
      const budgetsData = budgetsRes.ok ? ((await budgetsRes.json()) as { budgets: Budget[] }) : { budgets: [] };
      const cashflowData = cashflowRes.ok ? ((await cashflowRes.json()) as { cashflow: CashflowEntry[] }) : { cashflow: [] };
      const goalsData = goalsRes.ok ? ((await goalsRes.json()) as { goals: SavingsGoal[] }) : { goals: [] };
      const habitsData = habitsRes.ok
        ? ((await habitsRes.json()) as { habits: HabitToday[]; completedCount: number; totalCount: number })
        : { habits: [], completedCount: 0, totalCount: 0 };

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
        habitsToday: habitsData,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-1">
        <div className="h-32 animate-pulse rounded-xl bg-[#111114]" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[#111114]" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-52 animate-pulse rounded-xl bg-[#111114]" />
          <div className="h-52 animate-pulse rounded-xl bg-[#111114]" />
        </div>
      </div>
    );
  }

  const accounts = data?.accounts ?? [];
  const { assets, liabilities, netWorth } = calcNetWorth(accounts);
  const cashflow = data?.cashflow ?? [];
  const currentCashflow = cashflow.at(-1);
  const prevCashflow = cashflow.at(-2);
  const monthlyIncome = currentCashflow?.income ?? 0;
  const monthlySpending = currentCashflow?.spending ?? 0;
  const netCash = monthlyIncome - monthlySpending;
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
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-zinc-100">
            Good to see you, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{firstName}</span>
          </h1>
        </div>
        <Link
          href="/budget"
          className="group flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-400 hover:border-indigo-500/30 hover:bg-indigo-500/[0.06] hover:text-indigo-300 transition-all duration-150"
        >
          Full report
          <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* ── Net Worth Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#111114] border border-white/[0.06] p-8">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-16 -left-8 h-64 w-80 rounded-full bg-indigo-600/[0.12] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-0 h-48 w-64 rounded-full bg-violet-600/[0.08] blur-3xl" />
        {/* Dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        <div className="relative">
          {/* Header row */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-600">Net Worth</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-600">
                assets − liabilities
              </span>
            </div>
            <button
              onClick={toggleNetWorth}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label={showNetWorth ? 'Hide net worth' : 'Show net worth'}
            >
              {showNetWorth ? (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
              {showNetWorth ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              {showNetWorth ? (
                <p className={[
                  'text-5xl font-bold tracking-tight tabular-nums',
                  netWorth >= 0
                    ? 'bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent'
                    : 'text-rose-400',
                ].join(' ')}>
                  {netWorth < 0 ? '-' : ''}{fmt(Math.abs(netWorth))}
                </p>
              ) : (
                <p className="text-5xl font-bold tracking-tight text-zinc-700 select-none">••••••</p>
              )}

              {/* Assets / Liabilities breakdown */}
              {showNetWorth && accounts.length > 0 && (
                <div className="mt-3 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                    Assets <span className="text-emerald-400 font-medium">{fmt(assets)}</span>
                  </span>
                  {liabilities > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500/60" />
                      Liabilities <span className="text-rose-400 font-medium">{fmt(liabilities)}</span>
                    </span>
                  )}
                </div>
              )}

              <p className="mt-2 text-xs text-zinc-600">
                Across {accounts.length} linked {accounts.length === 1 ? 'account' : 'accounts'}
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-2 pb-1">
              <span className="text-xs font-medium text-zinc-600">This month</span>
              <div className={[
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold tabular-nums',
                netCash >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
              ].join(' ')}>
                <span>{netCash >= 0 ? '↑' : '↓'}</span>
                {netCash >= 0 ? '+' : ''}{fmt(netCash)}
              </div>
            </div>
          </div>
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
          valueColor="text-zinc-100"
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
          <div className="col-span-2 rounded-xl bg-[#111114] border border-white/[0.06] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Cash Flow</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-300">Income vs Spending</p>
              </div>
              <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Details →</Link>
            </div>
            <div className="flex items-end gap-2 h-36">
              {cashflow.slice(-6).map((entry, idx, arr) => {
                const maxVal = Math.max(...arr.map((e) => Math.max(e.income, e.spending)), 1);
                const incomeH = (entry.income / maxVal) * 100;
                const spendH = (entry.spending / maxVal) * 100;
                const isLast = idx === arr.length - 1;
                return (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-2 group">
                    <div className="relative flex w-full items-end justify-center gap-0.5 h-28">
                      {/* Hover tooltip */}
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                        <div className="rounded-lg bg-[#1c1c1f] border border-white/[0.06] px-2.5 py-1.5 text-xs whitespace-nowrap text-zinc-300">
                          <span className="text-emerald-400 font-medium">{fmtCompact(entry.income)}</span>
                          <span className="text-zinc-600 mx-1.5">·</span>
                          <span className="text-rose-400 font-medium">{fmtCompact(entry.spending)}</span>
                        </div>
                      </div>
                      <div
                        className={['flex-1 rounded-t transition-all', isLast ? 'bg-emerald-500' : 'bg-emerald-500/30 group-hover:bg-emerald-500/50'].join(' ')}
                        style={{ height: `${incomeH}%` }}
                      />
                      <div
                        className={['flex-1 rounded-t transition-all', isLast ? 'bg-rose-500' : 'bg-rose-500/30 group-hover:bg-rose-500/50'].join(' ')}
                        style={{ height: `${spendH}%` }}
                      />
                    </div>
                    <p className={['text-xs truncate w-full text-center', isLast ? 'text-zinc-200 font-medium' : 'text-zinc-600'].join(' ')}>
                      {entry.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 border-t border-white/[0.06] pt-3">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-sm bg-emerald-500/60" />Income
              </span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-sm bg-rose-500/60" />Spending
              </span>
            </div>
          </div>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
            <p className="mb-3 text-xs font-medium text-zinc-500">Accounts</p>
            <div className="space-y-3">
              {accounts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-zinc-400">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-300">{a.name}</p>
                      <p className="text-xs capitalize text-zinc-600">{a.type}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-100 ml-2">
                    {a.currentBalance !== null ? fmtCompact(a.currentBalance) : '—'}
                  </p>
                </div>
              ))}
              {accounts.length > 4 && (
                <p className="text-xs text-zinc-600">+{accounts.length - 4} more accounts</p>
              )}
            </div>
          </div>
        )}

        {/* If no cashflow, span accounts full width */}
        {cashflow.length === 0 && accounts.length === 0 && (
          <div className="col-span-3 rounded-xl bg-[#111114] border border-white/[0.06] p-6 text-center">
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
        <div className="col-span-2 rounded-xl bg-[#111114] border border-white/[0.06] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Budget Health</p>
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
                <span className="w-16 text-right text-xs font-medium text-zinc-600">Budget</span>
                <span className="w-16 text-right text-xs font-medium text-zinc-600">Actual</span>
                <span className="w-16 text-right text-xs font-medium text-zinc-600">Left</span>
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
                    <div key={b.category} className="group rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
                      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <RingGauge pct={pct} color={ringColor} size={30} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-xs font-medium text-zinc-200">
                              <CategoryIcon category={b.category} size={12} className="shrink-0 text-zinc-500" />
                              {b.category}
                            </p>
                            {over && <span className="text-xs font-medium text-rose-400">Over budget</span>}
                            {warn && !over && <span className="text-xs font-medium text-amber-400">Almost there</span>}
                          </div>
                        </div>
                        <span className="w-16 text-right text-xs text-zinc-500 tabular-nums">{fmtCompact(b.amount)}</span>
                        <span className={['w-16 text-right text-xs font-medium tabular-nums', over ? 'text-rose-400' : 'text-zinc-300'].join(' ')}>
                          {fmtCompact(spent)}
                        </span>
                        <span className={['w-16 text-right text-xs font-semibold tabular-nums', over ? 'text-rose-400' : remaining < b.amount * 0.2 ? 'text-amber-400' : 'text-emerald-400'].join(' ')}>
                          {over ? `-${fmtCompact(Math.abs(remaining))}` : fmtCompact(remaining)}
                        </span>
                      </div>
                      {/* Thin progress bar */}
                      <div className="mt-2 ml-10 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
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
        <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Goals</p>
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
                      <span className="shrink-0 ml-1 text-xs font-semibold tabular-nums" style={{ color }}>
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: color }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-zinc-600 tabular-nums">
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

      {/* ── Habits Today Widget ── */}
      {(data?.habitsToday.totalCount ?? 0) > 0 && (
        <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Today&apos;s Habits</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-300">
                {data?.habitsToday.completedCount ?? 0} of {data?.habitsToday.totalCount ?? 0} completed
              </p>
            </div>
            <Link href="/habits" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">All habits →</Link>
          </div>
          {/* Progress bar */}
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.round(((data?.habitsToday.completedCount ?? 0) / Math.max(data?.habitsToday.totalCount ?? 1, 1)) * 100)}%` }}
            />
          </div>
          {/* Habit pills */}
          <div className="flex flex-wrap gap-2">
            {(data?.habitsToday.habits ?? []).slice(0, 8).map((h) => (
              <div
                key={h.id}
                className={[
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  h.todayCompleted
                    ? 'border-transparent text-zinc-300'
                    : 'border-white/[0.06] bg-white/[0.04] text-zinc-500',
                ].join(' ')}
                style={h.todayCompleted ? { backgroundColor: `${h.color}20`, borderColor: `${h.color}40`, color: h.color } : {}}
              >
                {h.icon && <span>{h.icon}</span>}
                {h.name}
                {h.todayCompleted && (
                  <svg className="h-3 w-3 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Spending + Recent Transactions ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Top Spending */}
        {topSpending.length > 0 && (
          <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">Top Spending</p>
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
                        <span className="shrink-0" style={{ color: color }}><CategoryIcon category={cat} size={13} /></span>
                        {cat}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-zinc-200">{fmtCompact(amount)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Recent</p>
            <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">All →</Link>
          </div>
          {(data?.recentTxs ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">No transactions this month.</p>
          ) : (
            <div className="space-y-0.5">
              {(data?.recentTxs ?? []).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04]">
                  {tx.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tx.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${categoryColor[tx.category ?? ''] ?? '#71717a'}18` }}
                    >
                      <CategoryIcon
                        category={tx.category ?? 'Other'}
                        size={15}
                        className="opacity-80"
                        color={categoryColor[tx.category ?? ''] ?? '#71717a'}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-200">{tx.merchantName ?? tx.name}</p>
                    <p className="text-xs text-zinc-600">
                      {tx.category ?? 'Other'} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <p className={['shrink-0 text-xs font-semibold tabular-nums', tx.amount < 0 ? 'text-emerald-400' : 'text-zinc-200'].join(' ')}>
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
    <div className="relative overflow-hidden rounded-xl bg-[#111114] border border-white/[0.06] p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={['mt-2.5 text-3xl font-bold tracking-tight tabular-nums', valueColor].join(' ')}>{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {trend !== null && (
          <span className={[
            'text-xs font-semibold rounded-lg px-1.5 py-0.5',
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : isNegative ? 'bg-rose-500/10 text-rose-400' : 'text-zinc-500',
          ].join(' ')}>
            {isPositive ? '↓' : '↑'} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        <p className="text-xs text-zinc-600">{sub}</p>
      </div>
    </div>
  );
}
