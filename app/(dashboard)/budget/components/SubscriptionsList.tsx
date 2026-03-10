'use client';

import { useEffect, useState } from 'react';

interface RecurringStream {
  stream_id: string;
  merchant_name?: string;
  description?: string;
  average_amount?: { amount: number };
  last_amount?: { amount: number };
  frequency?: string;
  last_date?: string;
  is_active?: boolean;
  status?: string;
  personal_finance_category?: { primary: string; detailed: string };
  logo_url?: string;
}

const FREQ_LABEL: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  SEMI_MONTHLY: 'Twice/month',
  MONTHLY: 'Monthly',
  ANNUALLY: 'Annually',
  UNKNOWN: 'Irregular',
};

function monthlyEquivalent(amount: number, freq?: string): number {
  switch (freq) {
    case 'WEEKLY': return amount * 52 / 12;
    case 'BIWEEKLY': return amount * 26 / 12;
    case 'SEMI_MONTHLY': return amount * 2;
    case 'ANNUALLY': return amount / 12;
    default: return amount;
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function SubscriptionsList() {
  const [outflow, setOutflow] = useState<RecurringStream[]>([]);
  const [inflow, setInflow] = useState<RecurringStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/plaid/recurring')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load');
        const data = (await r.json()) as { inflow: RecurringStream[]; outflow: RecurringStream[] };
        setOutflow(data.outflow);
        setInflow(data.inflow);
      })
      .catch(() => setError('Could not load recurring transactions.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const activeSubscriptions = outflow.filter((s) => s.is_active !== false);
  const monthlyTotal = activeSubscriptions.reduce((sum, s) => {
    const amt = s.average_amount?.amount ?? s.last_amount?.amount ?? 0;
    return sum + monthlyEquivalent(Math.abs(amt), s.frequency);
  }, 0);

  const activeIncome = inflow.filter((s) => s.is_active !== false);

  if (outflow.length === 0 && inflow.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-2xl">🔄</div>
        <p className="text-sm font-medium text-zinc-300">No recurring transactions found</p>
        <p className="mt-1 max-w-xs text-xs text-zinc-500">
          Sync your transactions first. Plaid detects recurring charges after 3+ occurrences.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Monthly subscriptions</p>
          <p className="mt-1 text-xl font-bold text-zinc-100">{fmt(monthlyTotal)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">{activeSubscriptions.length} active</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Annual cost</p>
          <p className="mt-1 text-xl font-bold text-zinc-100">{fmt(monthlyTotal * 12)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">Projected</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-zinc-500">Recurring income</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{activeIncome.length} stream{activeIncome.length !== 1 ? 's' : ''}</p>
          <p className="mt-0.5 text-xs text-zinc-600">Detected</p>
        </div>
      </div>

      {/* Subscriptions / outflow */}
      {outflow.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recurring Charges
          </h3>
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
            {activeSubscriptions.map((sub) => {
              const name = sub.merchant_name ?? sub.description ?? 'Unknown';
              const amt = Math.abs(sub.average_amount?.amount ?? sub.last_amount?.amount ?? 0);
              const monthly = monthlyEquivalent(amt, sub.frequency);
              const isEarlyDetection = sub.status === 'EARLY_DETECTION';

              return (
                <div key={sub.stream_id} className="flex items-center gap-3 px-4 py-3">
                  {/* Icon / logo */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                    {name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
                      {isEarlyDetection && (
                        <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                          New
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{FREQ_LABEL[sub.frequency ?? ''] ?? sub.frequency ?? 'Recurring'}</span>
                      {sub.last_date && (
                        <>
                          <span>·</span>
                          <span>Last: {new Date(sub.last_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-100">{fmt(amt)}</p>
                    {sub.frequency !== 'MONTHLY' && sub.frequency !== 'UNKNOWN' && (
                      <p className="text-xs text-zinc-500">{fmt(monthly)}/mo</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Inactive subscriptions */}
            {outflow.filter((s) => s.is_active === false).map((sub) => {
              const name = sub.merchant_name ?? sub.description ?? 'Unknown';
              const amt = Math.abs(sub.average_amount?.amount ?? sub.last_amount?.amount ?? 0);
              return (
                <div key={sub.stream_id} className="flex items-center gap-3 px-4 py-3 opacity-40">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-300 line-through">{name}</p>
                    <p className="mt-0.5 text-xs text-zinc-600">Cancelled / inactive</p>
                  </div>
                  <p className="text-sm text-zinc-400">{fmt(amt)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recurring income */}
      {inflow.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recurring Income
          </h3>
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
            {inflow.map((stream) => {
              const name = stream.merchant_name ?? stream.description ?? 'Income';
              const amt = Math.abs(stream.average_amount?.amount ?? stream.last_amount?.amount ?? 0);
              return (
                <div key={stream.stream_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-400">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {FREQ_LABEL[stream.frequency ?? ''] ?? 'Recurring'}
                      {stream.last_date && ` · Last: ${new Date(stream.last_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">+{fmt(amt)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
