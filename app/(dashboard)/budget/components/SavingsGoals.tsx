'use client';

import { useState, useEffect, useRef } from 'react';

interface SavingsGoal {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
}

const PRESET_EMOJIS = ['🏠', '🚗', '✈️', '💍', '🎓', '🆘', '💻', '🎯', '🌴', '📦'];
const PRESET_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#f97316', '#14b8a6'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function daysUntil(dateStr: string): number {
  // Compare date-only values in UTC to avoid timezone skew
  const target = dateStr.slice(0, 10); // 'YYYY-MM-DD'
  const today = new Date().toISOString().slice(0, 10);
  const targetMs = new Date(target + 'T00:00:00Z').getTime();
  const todayMs = new Date(today + 'T00:00:00Z').getTime();
  return Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));
}

interface GoalModalProps {
  goal?: SavingsGoal;
  onClose: () => void;
  onSave: (goal: SavingsGoal) => void;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🎯');
  const [color, setColor] = useState(goal?.color ?? '#6366f1');
  const [target, setTarget] = useState(goal?.targetAmount?.toString() ?? '');
  const [current, setCurrent] = useState(goal?.currentAmount?.toString() ?? '0');
  const [targetDate, setTargetDate] = useState(() => {
    if (!goal?.targetDate) return '';
    // Safely extract YYYY-MM-DD regardless of whether it's ISO or date-only
    return goal.targetDate.slice(0, 10);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  async function handleSave() {
    if (!name.trim()) { setError('Goal name is required'); return; }
    const t = parseFloat(target);
    if (isNaN(t) || t <= 0) { setError('Enter a valid target amount'); return; }
    const c = parseFloat(current) || 0;

    setSaving(true);
    setError(null);

    try {
      const url = goal ? `/api/savings-goals/${goal.id}` : '/api/savings-goals';
      const method = goal ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          emoji,
          color,
          targetAmount: t,
          currentAmount: c,
          targetDate: targetDate || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = (await res.json()) as { goal: SavingsGoal };
      onSave(data.goal);
      onClose();
    } catch {
      setError('Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-[#111114] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">{goal ? 'Edit Goal' : 'New Savings Goal'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Emoji picker */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-zinc-500">Icon</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={[
                  'h-9 w-9 rounded-lg text-lg transition-all',
                  emoji === e ? 'bg-indigo-500/20 ring-2 ring-indigo-500' : 'bg-white/[0.04] hover:bg-white/[0.08]',
                ].join(' ')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-zinc-500">Color</p>
          <div className="flex gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-400">Goal name</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emergency Fund"
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Target amount */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-400">Target amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="10,000"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] py-2 pl-7 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Current amount */}
        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-400">Current amount saved</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] py-2 pl-7 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Target date */}
        <div className="mb-5">
          <label className="mb-1 block text-xs text-zinc-400">Target date (optional)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
          />
        </div>

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : 'Save Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const color = goal.color ?? '#6366f1';
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const days = goal.targetDate ? daysUntil(goal.targetDate) : null;

  let monthlyNeeded: number | null = null;
  if (days !== null && days > 0 && remaining > 0) {
    monthlyNeeded = remaining / (days / 30.44);
  }

  return (
    <div className="rounded-xl bg-[#111114] p-5 border border-white/[0.06]">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            {goal.emoji ?? '🎯'}
          </div>
          <div>
            <p className="font-medium text-zinc-100">{goal.name}</p>
            {days !== null && (
              <p className="text-xs text-zinc-500">
                {days > 0 ? `${days} days left` : 'Past due'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors"
            aria-label="Edit goal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-950 hover:text-red-400 transition-colors"
            aria-label="Delete goal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">
          {fmt(goal.currentAmount)} <span className="text-zinc-600">/ {fmt(goal.targetAmount)}</span>
        </span>
        <span className="font-medium" style={{ color }}>
          {pct >= 100 ? '✓ Complete!' : `${pct.toFixed(0)}%`}
        </span>
      </div>

      {monthlyNeeded !== null && monthlyNeeded > 0 && pct < 100 && (
        <p className="mt-2 text-xs text-zinc-500">
          Save {fmt(monthlyNeeded)}/mo to reach your goal on time
        </p>
      )}
    </div>
  );
}

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>(undefined);

  useEffect(() => {
    fetch('/api/savings-goals')
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as { goals: SavingsGoal[] };
        setGoals(data.goals);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSave(goal: SavingsGoal) {
    setGoals((prev) => {
      const exists = prev.find((g) => g.id === goal.id);
      if (exists) return prev.map((g) => (g.id === goal.id ? goal : g));
      return [...prev, goal];
    });
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
      } else {
        setDeleteError('Failed to delete goal. Please try again.');
      }
    } catch {
      setDeleteError('Network error. Please try again.');
    }
  }

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

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

  return (
    <div className="space-y-5">
      {deleteError && (
        <div className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
          <p className="text-sm text-red-400">{deleteError}</p>
          <button onClick={() => setDeleteError(null)} className="text-red-600 hover:text-red-400 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        {goals.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-zinc-500">{goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
            {completed > 0 && <span className="text-emerald-400">{completed} completed</span>}
            <span className="text-zinc-400">{fmt(totalSaved)} / {fmt(totalTarget)} total</span>
          </div>
        )}
        <button
          onClick={() => { setEditingGoal(undefined); setShowModal(true); }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Goal
        </button>
      </div>

      {/* Goals grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
            <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
          </div>
          <p className="text-sm font-medium text-zinc-300">No savings goals yet</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">
            Create goals for your emergency fund, vacation, down payment, or anything else.
          </p>
          <button
            onClick={() => { setEditingGoal(undefined); setShowModal(true); }}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Create your first goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={(g) => { setEditingGoal(g); setShowModal(true); }}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <GoalModal
          goal={editingGoal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
