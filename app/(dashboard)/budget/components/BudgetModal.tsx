'use client';

import { useState, useEffect, useRef } from 'react';
import { CATEGORY_ICONS } from '@/src/lib/categories';

interface BudgetModalProps {
  category: string;
  currentAmount: number | null;
  month: number;
  year: number;
  onClose: () => void;
  onSave: (category: string, amount: number) => void;
}

export default function BudgetModal({
  category,
  currentAmount,
  month,
  year,
  onClose,
  onSave,
}: BudgetModalProps) {
  const [amount, setAmount] = useState<string>(
    currentAmount !== null ? currentAmount.toString() : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSave() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount: parsed, month, year }),
      });

      if (!res.ok) throw new Error('Failed to save budget');
      onSave(category, parsed);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  const icon = CATEGORY_ICONS[category] ?? '📦';
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-[#111114] p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{icon}</span>
              <h2 className="text-base font-semibold text-zinc-100">{category}</h2>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Budget for {monthName} {year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label htmlFor="budget-amount" className="mb-1.5 block text-sm text-zinc-400">
            Monthly budget amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <input
              ref={inputRef}
              id="budget-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); }}
              placeholder="0.00"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] py-2.5 pl-7 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Budget'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
