'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PlaidLink from './PlaidLink';
import TransactionList from './TransactionList';
import BudgetModal from './BudgetModal';
import SubscriptionsList from './SubscriptionsList';
import SavingsGoals from './SavingsGoals';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '@/src/lib/categories';

const SpendingChart = dynamic(() => import('./SpendingChart'), { ssr: false });
const CashFlowChart = dynamic(() => import('./CashFlowChart'), { ssr: false });

// ---------- Types ----------

interface BankAccountItem {
  id: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currency: string;
  plaidItem: {
    institutionName: string | null;
    lastSynced: string | null;
  };
}

interface TransactionItem {
  id: string;
  name: string;
  merchantName: string | null;
  amount: number;
  date: string;
  category: string | null;
  pending: boolean;
  bankAccount: {
    name: string;
    mask: string | null;
    plaidItem: {
      institutionName: string | null;
    };
  };
}

interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

interface CashFlowEntry {
  label: string;
  income: number;
  spending: number;
}

// ---------- Helpers ----------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Tab = 'overview' | 'subscriptions' | 'goals' | 'cashflow';

function formatCurrency(value: number | null, currency = 'USD') {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

// ---------- Sub-components ----------

function AccountCard({ account }: { account: BankAccountItem }) {
  const institution = account.plaidItem.institutionName ?? 'Bank';
  const typeLabel = account.subtype
    ? account.subtype.charAt(0).toUpperCase() + account.subtype.slice(1)
    : account.type;

  return (
    <div className="rounded-xl bg-[#111114] p-5 border border-white/[0.06]">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{institution}</p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-100">{account.name}</p>
        </div>
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-zinc-400">
          {typeLabel}
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-zinc-100">
        {formatCurrency(account.currentBalance, account.currency)}
      </p>
      {account.availableBalance !== null && account.availableBalance !== account.currentBalance && (
        <p className="mt-0.5 text-xs text-zinc-600">
          {formatCurrency(account.availableBalance, account.currency)} available
        </p>
      )}
      {account.mask && (
        <p className="mt-2 text-xs text-zinc-700">••••{account.mask}</p>
      )}
    </div>
  );
}

interface BudgetProgressRowProps {
  category: string;
  spent: number;
  budget: number | null;
  onSetBudget: (category: string) => void;
}

function BudgetProgressRow({ category, spent, budget, onSetBudget }: BudgetProgressRowProps) {
  const color = CATEGORY_COLORS[category] ?? '#6b7280';
  const icon = CATEGORY_ICONS[category] ?? '📦';

  const pct = budget ? Math.min((spent / budget) * 100, 100) : 0;
  const isOver = budget !== null && spent > budget;
  const isWarning = budget !== null && pct >= 80 && !isOver;
  const barColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ backgroundColor: `${color}20` }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-200">{category}</span>
          <span className="text-xs text-zinc-400">
            {formatCurrency(spent)}{budget !== null ? ` / ${formatCurrency(budget)}` : ''}
          </span>
        </div>
        {budget !== null ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
        ) : (
          <div className="h-1.5 w-full rounded-full bg-white/[0.06]" />
        )}
      </div>
      {budget === null ? (
        <button
          onClick={() => onSetBudget(category)}
          className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-zinc-400 hover:border-indigo-500/40 hover:bg-white/[0.08] hover:text-indigo-400 transition-colors"
        >
          Set budget
        </button>
      ) : (
        <button
          onClick={() => onSetBudget(category)}
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Edit
        </button>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  borderColor,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  borderColor?: string;
}) {
  return (
    <div className="rounded-xl bg-[#111114] p-5 border border-white/[0.06]">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={['mt-2 text-2xl font-semibold tabular-nums tracking-tight', color ?? 'text-zinc-100'].join(' ')}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

// ---------- Main component ----------

export default function BudgetClient() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [cashflow, setCashflow] = useState<CashFlowEntry[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<string | null>(null);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    const today = new Date();
    const isCurrentOrFuture = year > today.getFullYear() ||
      (year === today.getFullYear() && month >= today.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [accountsRes, txRes, budgetRes, cashflowRes] = await Promise.all([
        fetch('/api/plaid/accounts'),
        fetch(`/api/plaid/transactions?month=${month}&year=${year}`),
        fetch(`/api/budget?month=${month}&year=${year}`),
        fetch('/api/budget/cashflow'),
      ]);

      if (accountsRes.ok) {
        const data = (await accountsRes.json()) as { accounts: BankAccountItem[] };
        setAccounts(data.accounts);
      } else {
        setLoadError('Failed to load account data. Please refresh.');
      }
      if (txRes.ok) {
        const data = (await txRes.json()) as { transactions: TransactionItem[] };
        setTransactions(data.transactions);
      }
      if (budgetRes.ok) {
        const data = (await budgetRes.json()) as { budgets: BudgetItem[] };
        setBudgets(data.budgets);
      }
      if (cashflowRes.ok) {
        const data = (await cashflowRes.json()) as { cashflow: CashFlowEntry[] };
        setCashflow(data.cashflow);
      }
    } catch {
      setLoadError('Network error loading data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSync() {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/plaid/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      await loadData();
    } catch {
      setSyncError('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }

  // Derived data
  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);

  const monthIncome = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const monthSpending = transactions
    .filter((tx) => tx.amount > 0 && tx.category !== 'Transfer')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netCashFlow = monthIncome - monthSpending;

  const spendingByCategory = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    if (cat === 'Income' || cat === 'Transfer') return acc;
    const total = transactions
      .filter((tx) => tx.category === cat && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    if (total > 0) acc[cat] = total;
    return acc;
  }, {});

  const spendingChartData = Object.entries(spendingByCategory).map(([category, amount]) => ({
    category,
    amount,
  }));

  const budgetMap = new Map(budgets.map((b) => [b.category, b.amount]));
  const hasAccounts = accounts.length > 0;
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const modalBudget = modalCategory ? (budgetMap.get(modalCategory) ?? null) : null;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'goals', label: 'Goals' },
    { id: 'cashflow', label: 'Cash Flow' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Budget</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Track spending, subscriptions, and savings goals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasAccounts && (
            <button
              onClick={() => void handleSync()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.08] hover:text-zinc-100 disabled:opacity-50 transition-colors"
            >
              <svg
                className={['h-4 w-4', isSyncing ? 'animate-spin' : ''].join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          )}
          <PlaidLink onSuccess={() => void loadData()} />
        </div>
      </div>

      {/* Error banners */}
      {syncError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-400">{syncError}</p>
          <button onClick={() => setSyncError(null)} className="text-red-600 hover:text-red-400 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {loadError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-400">{loadError}</p>
          <button onClick={() => void loadData()} className="text-xs text-red-400 underline hover:text-red-300">Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="h-6 w-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : !hasAccounts ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#111114] py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <svg className="h-8 w-8 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-100">Connect your bank account</h2>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">
            Link your bank to automatically import transactions, track spending, subscriptions, and set monthly budgets.
          </p>
          <div className="mt-6">
            <PlaidLink onSuccess={() => void loadData()} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              Read-only access
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Secured by Plaid
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              We never see your credentials
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Net worth"
              value={formatCurrency(totalBalance)}
              sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
              color="text-zinc-100"
              borderColor="border-zinc-500/30"
            />
            <StatCard
              label={`Income (${MONTH_NAMES[month - 1]})`}
              value={formatCurrency(monthIncome)}
              color="text-emerald-400"
              borderColor="border-emerald-500/50"
            />
            <StatCard
              label={`Spent (${MONTH_NAMES[month - 1]})`}
              value={formatCurrency(monthSpending)}
              color="text-zinc-100"
              borderColor="border-rose-500/50"
            />
            <StatCard
              label="Net cash flow"
              value={(netCashFlow >= 0 ? '+' : '') + formatCurrency(netCashFlow)}
              sub={netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              color={netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}
              borderColor="border-emerald-500/50"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150',
                  activeTab === tab.id
                    ? 'bg-[#1c1c1f] text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Month navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="rounded-lg bg-white/[0.06] p-1.5 text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-100 transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="min-w-[140px] text-center text-sm font-medium text-zinc-200">
                  {MONTH_NAMES[month - 1]} {year}
                  {isCurrentMonth && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-xs font-medium text-indigo-400">
                      Current
                    </span>
                  )}
                </span>
                <button
                  onClick={nextMonth}
                  disabled={isCurrentMonth}
                  className="rounded-lg bg-white/[0.06] p-1.5 text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next month"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Account cards */}
              <section>
                <h2 className="mb-3 text-xs font-medium text-zinc-500">
                  Connected Accounts
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              </section>

              {/* Spending chart + Budget progress */}
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl bg-[#111114] p-5 border border-white/[0.06]">
                  <h2 className="mb-4 text-sm font-semibold text-zinc-100">Spending by Category</h2>
                  <SpendingChart data={spendingChartData} />
                </section>

                <section className="rounded-xl bg-[#111114] p-5 border border-white/[0.06]">
                  <h2 className="mb-2 text-sm font-semibold text-zinc-100">Budget Progress</h2>
                  <div className="divide-y divide-white/[0.06]">
                    {CATEGORIES.filter((c) => c !== 'Income' && c !== 'Transfer').map((category) => (
                      <BudgetProgressRow
                        key={category}
                        category={category}
                        spent={spendingByCategory[category] ?? 0}
                        budget={budgetMap.get(category) ?? null}
                        onSetBudget={(cat) => setModalCategory(cat)}
                      />
                    ))}
                  </div>
                </section>
              </div>

              {/* Transactions */}
              <section className="rounded-xl bg-[#111114] p-5 border border-white/[0.06]">
                <h2 className="mb-4 text-sm font-semibold text-zinc-100">
                  Transactions
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    {MONTH_NAMES[month - 1]} {year}
                  </span>
                </h2>
                <TransactionList transactions={transactions} />
              </section>
            </div>
          )}

          {/* Tab: Subscriptions */}
          {activeTab === 'subscriptions' && (
            <SubscriptionsList />
          )}

          {/* Tab: Goals */}
          {activeTab === 'goals' && (
            <SavingsGoals />
          )}

          {/* Tab: Cash Flow */}
          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              <section className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
                <h2 className="mb-1 text-sm font-semibold text-zinc-100">Monthly Cash Flow</h2>
                <p className="mb-5 text-xs text-zinc-500">Income vs. spending over the last 6 months</p>
                <CashFlowChart data={cashflow} />
              </section>

              {/* Monthly breakdown table */}
              <section className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
                <h2 className="mb-4 text-sm font-semibold text-zinc-100">Monthly Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-left">
                        <th className="pb-2 text-xs font-medium text-zinc-500">Month</th>
                        <th className="pb-2 text-right text-xs font-medium text-zinc-500">Income</th>
                        <th className="pb-2 text-right text-xs font-medium text-zinc-500">Spending</th>
                        <th className="pb-2 text-right text-xs font-medium text-zinc-500">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {[...cashflow].reverse().map((row) => {
                        const net = row.income - row.spending;
                        return (
                          <tr key={row.label}>
                            <td className="py-2.5 text-zinc-300">{row.label}</td>
                            <td className="py-2.5 text-right text-emerald-400">
                              {row.income > 0 ? formatCurrency(row.income) : '—'}
                            </td>
                            <td className="py-2.5 text-right text-zinc-300">
                              {row.spending > 0 ? formatCurrency(row.spending) : '—'}
                            </td>
                            <td className={['py-2.5 text-right font-medium', net >= 0 ? 'text-emerald-400' : 'text-red-400'].join(' ')}>
                              {row.income === 0 && row.spending === 0
                                ? '—'
                                : (net >= 0 ? '+' : '') + formatCurrency(net)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* Budget modal */}
      {modalCategory && (
        <BudgetModal
          category={modalCategory}
          currentAmount={modalBudget}
          month={month}
          year={year}
          onClose={() => setModalCategory(null)}
          onSave={(cat, amount) => {
            setBudgets((prev) => {
              const existing = prev.find((b) => b.category === cat);
              if (existing) {
                return prev.map((b) => b.category === cat ? { ...b, amount } : b);
              }
              return [...prev, { id: crypto.randomUUID(), category: cat, amount, month, year }];
            });
          }}
        />
      )}
    </div>
  );
}
