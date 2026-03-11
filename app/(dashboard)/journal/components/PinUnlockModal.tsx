'use client';

import { useState } from 'react';

interface PinUnlockModalProps {
  entryId: string;
  onSuccess: () => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export default function PinUnlockModal({ entryId, onSuccess, onDeleted, onCancel }: PinUnlockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/journal/${entryId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        deleted?: boolean;
        attemptsLeft?: number;
      };

      if (data.deleted) {
        onDeleted();
        return;
      }

      if (data.success) {
        onSuccess();
        return;
      }

      const left = data.attemptsLeft ?? 0;
      setAttemptsLeft(left);
      setPin('');

      if (left === 1) {
        setError('Wrong PIN. 1 attempt left — this entry will be permanently erased on the next wrong attempt.');
      } else {
        setError(`Wrong PIN. ${left} attempts left.`);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCritical = attemptsLeft !== null && attemptsLeft <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xl">🔒</span>
          <h2 className="text-lg font-semibold text-zinc-100">Locked Entry</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-5">Enter your journal PIN to unlock this entry.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-[0.5em] text-center"
            autoFocus
            autoComplete="current-password"
          />

          {error && (
            <p className={['text-xs leading-relaxed', isCritical ? 'text-red-400 font-medium' : 'text-amber-400'].join(' ')}>
              {isCritical && '⚠️ '}{error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm text-white font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
