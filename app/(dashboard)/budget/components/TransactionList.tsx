'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '@/src/lib/categories';

const PAGE_SIZE = 25;

interface Transaction {
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

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Reset page when filters change — NOT inside useMemo (side effects don't belong there)
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        !search ||
        tx.name.toLowerCase().includes(search.toLowerCase()) ||
        (tx.merchantName?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesCategory =
        !categoryFilter || tx.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, categoryFilter]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  const loadMore = useCallback(() => setPage((p) => p + 1), []);

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_ICONS[cat]} {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-zinc-500">No transactions found</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {paginated.map((tx) => {
            const isIncome = tx.amount < 0;
            const absAmount = Math.abs(tx.amount);
            const categoryColor = CATEGORY_COLORS[tx.category ?? 'Other'] ?? '#6b7280';
            const categoryIcon = CATEGORY_ICONS[tx.category ?? 'Other'] ?? '📦';

            return (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                {/* Category icon */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                  style={{ backgroundColor: `${categoryColor}20` }}
                  aria-hidden="true"
                >
                  {categoryIcon}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {tx.merchantName ?? tx.name}
                    </p>
                    {tx.pending && (
                      <span className="inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {tx.category && (
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor,
                        }}
                      >
                        {tx.category}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <p
                  className={[
                    'shrink-0 text-sm font-semibold tabular-nums',
                    isIncome ? 'text-emerald-400' : 'text-zinc-100',
                  ].join(' ')}
                >
                  {isIncome ? '+' : '-'}$
                  {absAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            Load more ({filtered.length - paginated.length} remaining)
          </button>
        </div>
      )}
      {!hasMore && filtered.length > PAGE_SIZE && (
        <p className="mt-3 text-center text-xs text-zinc-500">
          All {filtered.length} transactions shown
        </p>
      )}
    </div>
  );
}
