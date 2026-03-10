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

      // Compute spending per category from transactions
      const spending: Record<string, number> = {};
      for (const tx of txsData.transactions) {
        if (tx.amount > 0 && tx.category && tx.category !== 'Transfer') {
          spending[tx.category] = (spending[tx.category] ?? 0) + tx.amount;
        }
      }

      setData({
        accounts: accountsData.accounts,
        recentTxs: txsData.transactions.slice(0, 5),
        budgets: budgetsData.budgets,
        spending,
        cashflow: cashflowData.cashflow,
        goals: goalsData.goals.slice(0, 3),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-lg bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  const accounts = data?.accounts ?? [];
  const netWorth = accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
  const currentCashflow = data?.cashflow.at(-1);
  const monthlyIncome = currentCashflow?.income ?? 0;
  const monthlySpending = currentCashflow?.spending ?? 0;
  const netCash = monthlyIncome - monthlySpending;

  // Budget health: categories at >= 80%
  const overBudget = (data?.budgets ?? []).filter((b) => {
    const spent = data?.spending[b.category] ?? 0;
    return b.amount > 0 && spent / b.amount >= 0.8;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Good to see you, {firstName}</h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s your financial snapshot.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Net Worth"
          value={fmt(netWorth)}
          sub="all accounts"
          color="text-zinc-100"
        />
        <StatCard
          label="Monthly Income"
          value={fmt(monthlyIncome)}
          sub="this month"
          color="text-emerald-400"
        />
        <StatCard
          label="Monthly Spending"
          value={fmt(monthlySpending)}
          sub="this month"
          color="text-rose-400"
        />
        <StatCard
          label="Net Cash Flow"
          value={fmt(Math.abs(netCash))}
          sub={netCash >= 0 ? 'surplus' : 'deficit'}
          color={netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Budget health */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Budget Health</h2>
            <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all →
            </Link>
          </div>
          {data?.budgets.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No budgets set.{' '}
              <Link href="/budget" className="text-indigo-400 hover:underline">Set one →</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {(data?.budgets ?? []).map((b) => {
                const spent = data?.spending[b.category] ?? 0;
                const pct = b.amount > 0 ? Math.min(spent / b.amount, 1) : 0;
                const over = spent > b.amount;
                const warn = pct >= 0.8 && !over;
                return (
                  <div key={b.category}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <span>{categoryEmoji[b.category] ?? '📦'}</span>
                        {b.category}
                        {over && <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-400">Over</span>}
                        {warn && <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">Warning</span>}
                      </span>
                      <span className={over ? 'text-rose-400' : 'text-zinc-400'}>
                        {fmtFull(spent)} / {fmtFull(b.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={['h-full rounded-full transition-all', over ? 'bg-rose-500' : warn ? 'bg-amber-500' : 'bg-indigo-500'].join(' ')}
                        style={{ width: `${Math.round(pct * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {overBudget.length > 0 && (
            <p className="mt-3 text-xs text-rose-400">
              {overBudget.length} {overBudget.length === 1 ? 'category' : 'categories'} over budget
            </p>
          )}
        </div>

        {/* Savings Goals */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Goals</h2>
            <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all →
            </Link>
          </div>
          {(data?.goals ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">
              No goals yet.{' '}
              <Link href="/budget" className="text-indigo-400 hover:underline">Add one →</Link>
            </p>
          ) : (
            <div className="space-y-4">
              {(data?.goals ?? []).map((g) => {
                const pct = g.targetAmount > 0 ? Math.min(g.currentAmount / g.targetAmount, 1) : 0;
                return (
                  <div key={g.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-zinc-300">
                        {g.emoji && <span>{g.emoji}</span>}
                        <span className="truncate max-w-[100px]">{g.name}</span>
                      </span>
                      <span className="text-zinc-400">{Math.round(pct * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round(pct * 100)}%`,
                          backgroundColor: g.color ?? '#6366f1',
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {fmtFull(g.currentAmount)} of {fmtFull(g.targetAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Recent Transactions</h2>
          <Link href="/budget" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            View all →
          </Link>
        </div>
        {(data?.recentTxs ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions this month.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {(data?.recentTxs ?? []).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  {tx.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tx.logoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-sm">
                      {categoryEmoji[tx.category ?? ''] ?? '📦'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-zinc-200">{tx.merchantName ?? tx.name}</p>
                    <p className="text-xs text-zinc-500">{tx.category ?? 'Other'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={['text-sm font-medium', tx.amount < 0 ? 'text-emerald-400' : 'text-zinc-200'].join(' ')}>
                    {tx.amount < 0 ? '+' : ''}{fmtFull(Math.abs(tx.amount))}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accounts */}
      {accounts.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-100">Accounts</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500 capitalize">{a.type}</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-200 truncate">{a.name}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100">
                  {a.currentBalance !== null ? fmtFull(a.currentBalance) : '—'}
                </p>
                {a.availableBalance !== null && a.availableBalance !== a.currentBalance && (
                  <p className="text-xs text-zinc-500">{fmtFull(a.availableBalance)} available</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={['mt-1 text-xl font-semibold', color].join(' ')}>{value}</p>
      <p className="mt-0.5 text-[10px] text-zinc-600">{sub}</p>
    </div>
  );
}
