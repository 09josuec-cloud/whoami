'use client';

import { useState, useEffect, useCallback } from 'react';

interface Reminder {
  id: string;
  title: string;
  notes?: string | null;
  dueAt: string;
  done: boolean;
  repeat?: string | null;
}

type Filter = 'pending' | 'all';

interface ReminderSection {
  label: string;
  color: 'red' | 'default';
  reminders: Reminder[];
}

const REPEAT_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

function formatDue(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (eventDay.getTime() === today.getTime()) return `Today at ${timeStr}`;
  if (eventDay.getTime() === tomorrow.getTime()) return `Tomorrow at ${timeStr}`;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + timeStr;
}

function isOverdue(r: Reminder): boolean {
  return !r.done && new Date(r.dueAt) < new Date();
}

function groupRemindersByDate(reminders: Reminder[], filter: Filter): ReminderSection[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const endOfWeek = new Date(today.getTime() + 7 * 86400000);

  const overdue: Reminder[] = [];
  const todayItems: Reminder[] = [];
  const tomorrowItems: Reminder[] = [];
  const thisWeek: Reminder[] = [];
  const later: Reminder[] = [];
  const completed: Reminder[] = [];

  for (const r of reminders) {
    if (r.done) {
      completed.push(r);
      continue;
    }
    const due = new Date(r.dueAt);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    if (due < now) {
      overdue.push(r);
    } else if (dueDay.getTime() === today.getTime()) {
      todayItems.push(r);
    } else if (dueDay.getTime() === tomorrow.getTime()) {
      tomorrowItems.push(r);
    } else if (due <= endOfWeek) {
      thisWeek.push(r);
    } else {
      later.push(r);
    }
  }

  const sections: ReminderSection[] = [];

  if (overdue.length > 0) {
    sections.push({ label: 'Overdue', color: 'red', reminders: overdue });
  }
  if (todayItems.length > 0) {
    sections.push({ label: 'Today', color: 'default', reminders: todayItems });
  }
  if (tomorrowItems.length > 0) {
    sections.push({ label: 'Tomorrow', color: 'default', reminders: tomorrowItems });
  }
  if (thisWeek.length > 0) {
    sections.push({ label: 'This Week', color: 'default', reminders: thisWeek });
  }
  if (later.length > 0) {
    sections.push({ label: 'Later', color: 'default', reminders: later });
  }
  if (filter === 'all' && completed.length > 0) {
    sections.push({ label: 'Completed', color: 'default', reminders: completed });
  }

  return sections;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [newRepeat, setNewRepeat] = useState('none');
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/reminders');
      if (res.ok) {
        const data = (await res.json()) as { reminders: Reminder[] };
        setReminders(data.reminders);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReminders(); }, [fetchReminders]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/calendar/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          notes: newNotes.trim() || undefined,
          dueAt: new Date(`${newDate}T${newTime}`).toISOString(),
          repeat: newRepeat === 'none' ? undefined : newRepeat,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { reminder: Reminder };
        setReminders((prev) =>
          [...prev, json.reminder].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
        );
        setNewTitle('');
        setNewNotes('');
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async (id: string) => {
    const res = await fetch(`/api/calendar/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    });
    if (res.ok) {
      const json = (await res.json()) as { reminder: Reminder };
      setReminders((prev) => prev.map((r) => (r.id === id ? json.reminder : r)));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/calendar/reminders/${id}`, { method: 'DELETE' });
    if (res.ok) setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const displayed = filter === 'pending' ? reminders.filter((r) => !r.done) : reminders;
  const pendingCount = reminders.filter((r) => !r.done).length;
  const overdueCount = reminders.filter(isOverdue).length;
  const sections = groupRemindersByDate(displayed, filter);

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Reminders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {pendingCount} pending{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Reminder
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] mb-6">
        {(['pending', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-3 py-2 text-sm capitalize transition-colors border-b-2 -mb-px',
              filter === f
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            {f === 'pending' ? `Pending (${pendingCount})` : 'All'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
        </div>
      ) : displayed.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-400 mb-1">
            {filter === 'pending' ? 'No pending reminders' : 'No reminders yet'}
          </p>
          <p className="text-xs text-zinc-600 mb-4">
            {filter === 'pending' ? "You're all caught up." : 'Create one to get started.'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add reminder
          </button>
        </div>
      ) : (
        /* Grouped reminders */
        <div>
          {sections.map((section) => (
            <div key={section.label}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
                <span className={[
                  'text-xs font-semibold uppercase tracking-widest',
                  section.color === 'red' ? 'text-red-500/70' : 'text-zinc-600',
                ].join(' ')}>
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-white/[0.04]" />
                <span className="text-xs text-zinc-600">{section.reminders.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {section.reminders.map((r) => {
                  const overdue = isOverdue(r);
                  const expanded = expandedId === r.id;
                  return (
                    <div
                      key={r.id}
                      className={[
                        'flex items-start gap-3 rounded-2xl bg-[#111114] border p-4 transition-all group',
                        overdue
                          ? 'border-l-2 border-l-red-500/50 border-white/[0.06] hover:border-white/[0.1]'
                          : r.done
                            ? 'border-white/[0.06] opacity-50'
                            : 'border-white/[0.06] hover:border-white/[0.1]',
                      ].join(' ')}
                    >
                      {/* Checkbox */}
                      {!r.done ? (
                        <button
                          onClick={() => void handleDone(r.id)}
                          className={[
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                            overdue
                              ? 'border-red-500/60 hover:border-red-400 hover:bg-red-500/20'
                              : 'border-zinc-700 hover:border-indigo-400 hover:bg-indigo-500/20',
                          ].join(' ')}
                          title="Mark done"
                        >
                          <svg className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 text-zinc-400" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 3 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : (
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white/[0.12] bg-white/[0.08]">
                          <svg className="h-2.5 w-2.5 text-zinc-400" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 3 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => r.notes && setExpandedId(expanded ? null : r.id)}
                      >
                        <p className={[
                          'text-sm font-medium',
                          r.done ? 'line-through text-zinc-500' : overdue ? 'text-red-300' : 'text-zinc-100',
                        ].join(' ')}>
                          {r.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className={['text-xs', overdue ? 'text-red-500' : 'text-zinc-500'].join(' ')}>
                            {formatDue(r.dueAt)}
                          </p>
                          {r.repeat && r.repeat !== 'none' && (
                            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-400">
                              {REPEAT_LABELS[r.repeat] ?? r.repeat}
                            </span>
                          )}
                          {r.notes && (
                            <span className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                              {expanded ? '▲ notes' : '▼ notes'}
                            </span>
                          )}
                        </div>
                        {expanded && r.notes && (
                          <p className="mt-2 text-xs text-zinc-400 whitespace-pre-wrap rounded-xl bg-white/[0.04] px-3 py-2">
                            {r.notes}
                          </p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => void handleDelete(r.id)}
                        className="shrink-0 rounded-lg p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#111114] border border-white/[0.08] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-zinc-100">New Reminder</h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowForm(false);
                  if (e.key === 'Enter' && newTitle.trim()) void handleAdd();
                }}
                placeholder="Reminder title *"
                className="w-full rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none border border-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full resize-none rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none border border-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-100 outline-none border border-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 [color-scheme:dark] transition-all"
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-32 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-100 outline-none border border-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 [color-scheme:dark] transition-all"
                />
              </div>
              <select
                value={newRepeat}
                onChange={(e) => setNewRepeat(e.target.value)}
                className="w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-100 outline-none border border-white/[0.06] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              >
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => void handleAdd()}
                  disabled={saving || !newTitle.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving…' : 'Add Reminder'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-white/[0.06] py-2.5 text-sm text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
