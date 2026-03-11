'use client';

import { useState } from 'react';

interface PinSetupModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinSetupModal({ onSuccess, onCancel }: PinSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4–6 digits (numbers only)');
      return;
    }
    if (pin !== confirm) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/journal/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Failed to set PIN');
        return;
      }
      onSuccess();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <h2 className="text-lg font-semibold text-zinc-100">Set up Journal PIN</h2>
        </div>

        <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300 leading-relaxed space-y-1.5">
          <p>This PIN protects your locked journal entries. Only you can unlock them.</p>
          <p className="font-medium text-amber-400">⚠️ This PIN cannot be recovered. If you forget it, locked entries will be permanently erased after 5 wrong attempts.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">PIN (4–6 digits)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-[0.5em] text-center"
              autoFocus
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1.5">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-[0.5em] text-center"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 mt-1">
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
              {loading ? 'Setting…' : 'Set PIN & Lock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
