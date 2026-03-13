'use client';

import { useState, useEffect, useCallback } from 'react';

interface Habit {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color: string;
  frequency: string;
  targetDays: number[];
  archived: boolean;
  order: number;
  todayCompleted: boolean;
  currentStreak: number;
}

interface HabitModalProps {
  habit?: Habit | null;
  onClose: () => void;
  onSaved: (habit: Habit) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const COLOR_NAMES: Record<string, string> = {
  '#6366f1': 'Indigo',
  '#8b5cf6': 'Violet',
  '#10b981': 'Emerald',
  '#f59e0b': 'Amber',
  '#ef4444': 'Rose',
  '#06b6d4': 'Cyan',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 … Sat=6, Sun=0

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function HabitModal({ habit, onClose, onSaved }: HabitModalProps) {
  const isEdit = Boolean(habit);

  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? '');
  const [color, setColor] = useState(habit?.color ?? COLORS[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(
    (habit?.frequency as 'daily' | 'weekly') ?? 'daily'
  );
  const [targetDays, setTargetDays] = useState<number[]>(habit?.targetDays ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleDay = (val: number) => {
    setTargetDays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]
    );
  };

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        color,
        frequency,
        targetDays: frequency === 'weekly' ? targetDays : [],
      };

      const url = isEdit ? `/api/habits/${habit!.id}` : '/api/habits';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? 'Failed to save. Please try again.');
        return;
      }

      const json = (await res.json()) as { habit: Habit };
      onSaved(json.habit);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, description, icon, color, frequency, targetDays, isEdit, habit, onSaved]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#111114] border border-white/[0.08] shadow-2xl shadow-black/60 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-zinc-100">
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto max-h-[70vh]">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSave();
              }}
              autoFocus
              placeholder="e.g. Morning run, Read 30 min…"
              className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description…"
              className="w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Icon */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Icon (emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="💪"
              maxLength={4}
              className="w-24 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-lg text-center text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Color swatches */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Color</label>
            <div className="flex items-center gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={COLOR_NAMES[c]}
                  className="relative h-7 w-7 rounded-full transition-all hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid rgba(255,255,255,0.7)` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                >
                  {color === c && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-3.5 w-3.5 text-white drop-shadow" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2.5 7l3 3.5 6-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={[
                    'flex-1 rounded-xl px-4 py-2.5 text-sm font-medium capitalize transition-colors border',
                    frequency === f
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07]',
                  ].join(' ')}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Target days — weekly only */}
          {frequency === 'weekly' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">
                Target Days
                <span className="ml-1 text-zinc-600 font-normal">(select which days)</span>
              </label>
              <div className="flex gap-1.5">
                {DAYS.map((day, i) => {
                  const val = DAY_VALUES[i];
                  const active = targetDays.includes(val);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(val)}
                      className={[
                        'flex-1 rounded-lg py-2 text-xs font-medium transition-colors border',
                        active
                          ? 'text-white border-transparent'
                          : 'bg-white/[0.04] border-white/[0.06] text-zinc-500 hover:text-zinc-300',
                      ].join(' ')}
                      style={active ? { backgroundColor: color, borderColor: 'transparent' } : {}}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 px-4 py-2.5 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !name.trim()}
            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/30"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
