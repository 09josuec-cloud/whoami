'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import HabitModal from './HabitModal';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface HealthMetric {
  date: string;
  steps?: number | null;
  sleep?: number | null;
  weight?: number | null;
  water?: number | null;
  calories?: number | null;
  heart_rate?: number | null;
}

type MetricKey = 'steps' | 'sleep' | 'weight' | 'water' | 'calories' | 'heart_rate';
type Tab = 'habits' | 'health';

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

const METRIC_CONFIG: {
  key: MetricKey;
  label: string;
  unit: string;
  placeholder: string;
}[] = [
  { key: 'steps',      label: 'Steps',       unit: 'steps', placeholder: '8,000' },
  { key: 'sleep',      label: 'Sleep',        unit: 'hrs',   placeholder: '8.0'   },
  { key: 'weight',     label: 'Weight',       unit: 'lbs',   placeholder: '160'   },
  { key: 'water',      label: 'Water',        unit: 'oz',    placeholder: '64'    },
  { key: 'calories',   label: 'Calories',     unit: 'kcal',  placeholder: '2,000' },
  { key: 'heart_rate', label: 'Heart Rate',   unit: 'bpm',   placeholder: '72'    },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

// Metric icons — each unique SVG path
function StepsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function SleepIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 5.4-6 6.6-6 10.5a6 6 0 0 0 12 0C18 9.6 13.2 8.4 12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v3m0 0h1.5M12 15h-1.5" />
    </svg>
  );
}

function WaterIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c0 0-6.75 7.31-6.75 11.25a6.75 6.75 0 0 0 13.5 0C18.75 9.56 12 2.25 12 2.25Z" />
    </svg>
  );
}

function CaloriesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function EmptyHabitsIcon() {
  return (
    <svg className="h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function getMetricIcon(key: MetricKey) {
  switch (key) {
    case 'steps':      return <StepsIcon />;
    case 'sleep':      return <SleepIcon />;
    case 'weight':     return <WeightIcon />;
    case 'water':      return <WaterIcon />;
    case 'calories':   return <CaloriesIcon />;
    case 'heart_rate': return <HeartIcon />;
  }
}

// ─── Completion Ring ──────────────────────────────────────────────────────────

function CompletionRing({
  completed,
  color,
  size = 52,
}: {
  completed: boolean;
  color: string;
  size?: number;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="4"
      />
      {completed && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${circ} ${circ}`}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ─── Mini bar chart (steps 7-day trend) ──────────────────────────────────────

function MiniBarChart({ metrics }: { metrics: HealthMetric[] }) {
  const last7 = [...metrics].slice(-7);
  const values = last7.map((m) => m.steps ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1.5 h-16">
      {last7.map((m, i) => {
        const pct = values[i] / max;
        const label = new Date(m.date + 'T12:00:00').toLocaleDateString([], {
          weekday: 'short',
        });
        return (
          <div key={m.date} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full flex flex-col justify-end" style={{ height: '44px' }}>
              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${Math.max(pct * 44, pct > 0 ? 4 : 2)}px`,
                  backgroundColor:
                    i === last7.length - 1
                      ? '#6366f1'
                      : 'rgba(99,102,241,0.35)',
                }}
                title={`${values[i].toLocaleString()} steps`}
              />
            </div>
            <span className="text-[9px] text-zinc-600 leading-none">{label.slice(0, 2)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function HabitsClient() {
  const [tab, setTab] = useState<Tab>('habits');

  // ── Habits state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Three-dot menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ── Health state
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [todayMetrics, setTodayMetrics] = useState<Partial<Record<MetricKey, number>>>({});
  const [healthLoading, setHealthLoading] = useState(true);
  const [editingMetric, setEditingMetric] = useState<MetricKey | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingMetric, setSavingMetric] = useState(false);
  const metricInputRef = useRef<HTMLInputElement | null>(null);

  // ── Fetch habits ───────────────────────────────────────────────────────────

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits/today');
      if (res.ok) {
        const data = (await res.json()) as {
          habits: Habit[];
          completedCount: number;
          totalCount: number;
        };
        setHabits(data.habits.filter((h) => !h.archived));
        setCompletedCount(data.completedCount);
        setTotalCount(data.totalCount);
      }
    } finally {
      setHabitsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHabits();
  }, [fetchHabits]);

  // ── Fetch health metrics ───────────────────────────────────────────────────

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/health-metrics?range=7');
      if (res.ok) {
        const data = (await res.json()) as { metrics: HealthMetric[] };
        setMetrics(data.metrics);
        // Find today's entry
        const t = data.metrics.find((m) => m.date === TODAY);
        if (t) {
          const entry: Partial<Record<MetricKey, number>> = {};
          for (const cfg of METRIC_CONFIG) {
            const val = t[cfg.key];
            if (val != null) entry[cfg.key] = val;
          }
          setTodayMetrics(entry);
        }
      }
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  // ── Close menu on outside click ────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    if (menuOpenId) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  // ── Focus metric input when editing ───────────────────────────────────────

  useEffect(() => {
    if (editingMetric && metricInputRef.current) {
      metricInputRef.current.focus();
      metricInputRef.current.select();
    }
  }, [editingMetric]);

  // ── Habit actions ──────────────────────────────────────────────────────────

  const toggleCompletion = async (habit: Habit) => {
    const wasCompleted = habit.todayCompleted;
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, todayCompleted: !wasCompleted } : h
      )
    );
    setCompletedCount((prev) => (wasCompleted ? prev - 1 : prev + 1));

    const method = wasCompleted ? 'DELETE' : 'POST';
    const res = await fetch(`/api/habits/${habit.id}/log`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: TODAY }),
    });

    if (!res.ok) {
      // Revert on failure
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, todayCompleted: wasCompleted } : h
        )
      );
      setCompletedCount((prev) => (wasCompleted ? prev + 1 : prev - 1));
    }
  };

  const handleArchive = async (id: string) => {
    setMenuOpenId(null);
    const res = await fetch(`/api/habits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    });
    if (res.ok) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setTotalCount((prev) => prev - 1);
    }
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setTotalCount((prev) => prev - 1);
    }
  };

  const openNewModal = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setMenuOpenId(null);
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const onHabitSaved = (saved: Habit) => {
    setHabits((prev) => {
      const exists = prev.find((h) => h.id === saved.id);
      if (exists) return prev.map((h) => (h.id === saved.id ? saved : h));
      setTotalCount((c) => c + 1);
      return [saved, ...prev];
    });
    setModalOpen(false);
    setEditingHabit(null);
  };

  // ── Health metric actions ──────────────────────────────────────────────────

  const startEditMetric = (key: MetricKey) => {
    const current = todayMetrics[key];
    setEditValue(current != null ? String(current) : '');
    setEditingMetric(key);
  };

  const saveMetric = async (key: MetricKey) => {
    const num = parseFloat(editValue.replace(/,/g, ''));
    if (isNaN(num) || num < 0) {
      setEditingMetric(null);
      return;
    }
    setSavingMetric(true);
    try {
      const res = await fetch('/api/health-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: TODAY, type: key, value: num }),
      });
      if (res.ok) {
        setTodayMetrics((prev) => ({ ...prev, [key]: num }));
        // Also update the metrics array
        setMetrics((prev) => {
          const idx = prev.findIndex((m) => m.date === TODAY);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [key]: num };
            return updated;
          }
          return [...prev, { date: TODAY, [key]: num }];
        });
      }
    } finally {
      setSavingMetric(false);
      setEditingMetric(null);
    }
  };

  // ── Progress bar helpers ───────────────────────────────────────────────────

  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full px-6 py-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Habits &amp; Health</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {tab === 'habits'
              ? `${completedCount} of ${totalCount} habits done today`
              : 'Track your daily health metrics'}
          </p>
        </div>
        {tab === 'habits' && (
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-900/30"
          >
            <PlusIcon />
            Add habit
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-white/[0.06] mb-6">
        {(['habits', 'health'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px font-medium',
              tab === t
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            {t === 'habits' ? 'Habits' : 'Health'}
          </button>
        ))}
      </div>

      {/* ══════════════════════ HABITS TAB ══════════════════════ */}
      {tab === 'habits' && (
        <>
          {/* Today's Progress */}
          {totalCount > 0 && (
            <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-300">Today&apos;s Progress</span>
                <span className="text-sm font-semibold text-zinc-100">
                  {completedCount}
                  <span className="text-zinc-500 font-normal"> / {totalCount}</span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background:
                      progressPct === 100
                        ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                        : '#6366f1',
                  }}
                />
              </div>
              {progressPct === 100 && (
                <p className="text-xs text-indigo-400 mt-2.5 font-medium">
                  All habits complete — great work today!
                </p>
              )}
            </div>
          )}

          {/* Loading */}
          {habitsLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-indigo-500" />
            </div>
          ) : habits.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] border border-dashed border-white/[0.12]">
                <EmptyHabitsIcon />
              </div>
              <h3 className="text-lg font-semibold text-zinc-300 mb-1">No habits yet</h3>
              <p className="text-sm text-zinc-600 mb-6">
                Build your first routine. Small steps, big results.
              </p>
              <button
                onClick={openNewModal}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-900/30"
              >
                <PlusIcon />
                Create your first habit
              </button>
            </div>
          ) : (
            /* Habit cards grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  menuOpenId={menuOpenId}
                  menuRef={menuRef}
                  onToggle={() => void toggleCompletion(habit)}
                  onMenuToggle={(id) =>
                    setMenuOpenId((prev) => (prev === id ? null : id))
                  }
                  onEdit={() => openEditModal(habit)}
                  onArchive={() => void handleArchive(habit.id)}
                  onDelete={() => void handleDelete(habit.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════ HEALTH TAB ══════════════════════ */}
      {tab === 'health' && (
        <>
          {healthLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-indigo-500" />
            </div>
          ) : (
            <>
              {/* Date label */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Today
                </span>
                <div className="flex-1 h-px bg-white/[0.04]" />
                <span className="text-xs text-zinc-600">
                  {new Date(TODAY + 'T12:00:00').toLocaleDateString([], {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* Metric cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {METRIC_CONFIG.map((cfg) => {
                  const val = todayMetrics[cfg.key];
                  const isEditing = editingMetric === cfg.key;

                  return (
                    <button
                      key={cfg.key}
                      onClick={() => {
                        if (!isEditing) startEditMetric(cfg.key);
                      }}
                      className={[
                        'rounded-xl bg-[#111114] border p-4 text-left transition-all group',
                        isEditing
                          ? 'border-indigo-500/50 ring-1 ring-indigo-500/30'
                          : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-[#161619]',
                      ].join(' ')}
                    >
                      {/* Icon row */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.06] text-indigo-400">
                          {getMetricIcon(cfg.key)}
                        </span>
                        {val != null && !isEditing && (
                          <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            edit
                          </span>
                        )}
                      </div>

                      {/* Label */}
                      <p className="text-xs text-zinc-500 mb-1">{cfg.label}</p>

                      {/* Value / input */}
                      {isEditing ? (
                        <div className="flex items-end gap-1.5">
                          <input
                            ref={metricInputRef}
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => void saveMetric(cfg.key)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void saveMetric(cfg.key);
                              if (e.key === 'Escape') setEditingMetric(null);
                            }}
                            placeholder={cfg.placeholder}
                            className="w-full bg-transparent text-xl font-bold text-zinc-100 outline-none placeholder-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-zinc-500 pb-1 shrink-0">{cfg.unit}</span>
                        </div>
                      ) : (
                        <div className="flex items-end gap-1.5">
                          <span
                            className={[
                              'text-xl font-bold',
                              val != null ? 'text-zinc-100' : 'text-zinc-700',
                            ].join(' ')}
                          >
                            {val != null
                              ? cfg.key === 'steps' || cfg.key === 'calories'
                                ? val.toLocaleString()
                                : val
                              : '—'}
                          </span>
                          {val != null && (
                            <span className="text-xs text-zinc-500 pb-0.5">{cfg.unit}</span>
                          )}
                        </div>
                      )}

                      {savingMetric && isEditing && (
                        <p className="text-[10px] text-indigo-400 mt-1">Saving…</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 7-day steps trend */}
              <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">Steps — 7-day trend</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Daily step count</p>
                  </div>
                  {metrics.length > 0 && (() => {
                    const vals = metrics.map((m) => m.steps ?? 0).filter(Boolean);
                    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
                    return avg ? (
                      <div className="text-right">
                        <p className="text-lg font-bold text-zinc-100">{avg.toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-500">avg / day</p>
                      </div>
                    ) : null;
                  })()}
                </div>

                {metrics.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-sm text-zinc-600">
                    No data yet — log your steps above.
                  </div>
                ) : (
                  <MiniBarChart metrics={metrics} />
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <HabitModal
          habit={editingHabit}
          onClose={() => {
            setModalOpen(false);
            setEditingHabit(null);
          }}
          onSaved={onHabitSaved}
        />
      )}
    </div>
  );
}

// ─── Habit Card (extracted to keep main component clean) ──────────────────────

interface HabitCardProps {
  habit: Habit;
  menuOpenId: string | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onMenuToggle: (id: string) => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function HabitCard({
  habit,
  menuOpenId,
  menuRef,
  onToggle,
  onMenuToggle,
  onEdit,
  onArchive,
  onDelete,
}: HabitCardProps) {
  const isMenuOpen = menuOpenId === habit.id;

  return (
    <div
      className={[
        'relative rounded-xl bg-[#111114] border border-white/[0.06] p-4',
        'transition-all duration-200 hover:border-white/[0.1] group',
        habit.todayCompleted ? 'bg-[#111114]' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {/* Completion ring + toggle button */}
        <button
          onClick={onToggle}
          className="relative shrink-0 flex items-center justify-center mt-0.5 focus:outline-none"
          style={{ width: 52, height: 52 }}
          title={habit.todayCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <CompletionRing completed={habit.todayCompleted} color={habit.color} size={52} />
          {/* Center content */}
          <span className="absolute inset-0 flex items-center justify-center">
            {habit.todayCompleted ? (
              <span
                className="flex items-center justify-center h-8 w-8 rounded-full"
                style={{ backgroundColor: habit.color + '22' }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={habit.color}
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            ) : habit.icon ? (
              <span className="text-xl leading-none select-none">{habit.icon}</span>
            ) : (
              <span
                className="h-3 w-3 rounded-full opacity-40"
                style={{ backgroundColor: habit.color }}
              />
            )}
          </span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className={[
                  'text-sm font-semibold leading-snug truncate transition-colors',
                  habit.todayCompleted ? 'text-zinc-400 line-through' : 'text-zinc-100',
                ].join(' ')}
              >
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{habit.description}</p>
              )}
            </div>

            {/* Three-dot menu */}
            <div className="relative shrink-0" ref={isMenuOpen ? menuRef : undefined}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle(habit.id);
                }}
                className="flex items-center justify-center h-7 w-7 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
              >
                <DotsIcon />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-20 w-40 rounded-xl bg-[#1c1c1f] border border-white/[0.1] shadow-2xl shadow-black/60 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors text-left"
                  >
                    <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors text-left"
                  >
                    <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                    Archive
                  </button>
                  <div className="h-px bg-white/[0.06] mx-3" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Streak badge + frequency */}
          <div className="flex items-center gap-2 mt-2">
            {habit.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                🔥 {habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''}
              </span>
            )}
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
              style={{
                backgroundColor: habit.color + '18',
                color: habit.color,
              }}
            >
              {habit.frequency}
            </span>
          </div>
        </div>
      </div>

      {/* Color bar at bottom */}
      <div
        className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-30"
        style={{ backgroundColor: habit.color }}
      />
    </div>
  );
}
