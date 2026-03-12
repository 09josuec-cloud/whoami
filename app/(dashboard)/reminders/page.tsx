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

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Reminders</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {pendingCount} pending
            {overdueCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                {overdueCount} overdue
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          + New Reminder
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-100">New Reminder</h3>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowForm(false); }}
              placeholder="Reminder title *"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-32 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
              />
              <select
                value={newRepeat}
                onChange={(e) => setNewRepeat(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void handleAdd()}
                disabled={saving || !newTitle.trim()}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Add Reminder'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
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

      {/* Reminders list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-3xl">🔔</div>
          <p className="text-sm text-zinc-400">
            {filter === 'pending' ? 'No pending reminders.' : 'No reminders yet.'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Add your first reminder
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map((r) => {
            const overdue = isOverdue(r);
            const expanded = expandedId === r.id;
            return (
              <div
                key={r.id}
                className={[
                  'group rounded-xl border bg-zinc-900 p-4 transition-colors',
                  overdue ? 'border-red-600/30' : r.done ? 'border-zinc-800 opacity-60' : 'border-zinc-800',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  {/* Done button */}
                  {!r.done ? (
                    <button
                      onClick={() => void handleDone(r.id)}
                      className={[
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                        overdue
                          ? 'border-red-500/60 hover:border-red-400 hover:bg-red-500/20'
                          : 'border-zinc-600 hover:border-indigo-400 hover:bg-indigo-500/20',
                      ].join(' ')}
                      title="Mark done & delete"
                    >
                      <svg className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 text-zinc-400" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 3 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : (
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-700">
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
                        {overdue && !r.done && <span className="mr-1 font-medium">Overdue ·</span>}
                        {formatDue(r.dueAt)}
                      </p>
                      {r.repeat && r.repeat !== 'none' && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                          {REPEAT_LABELS[r.repeat] ?? r.repeat}
                        </span>
                      )}
                      {r.notes && (
                        <span className="text-[10px] text-zinc-600 hover:text-zinc-400">
                          {expanded ? '▲ notes' : '▼ notes'}
                        </span>
                      )}
                    </div>
                    {expanded && r.notes && (
                      <p className="mt-2 text-xs text-zinc-400 whitespace-pre-wrap rounded-lg bg-zinc-800/50 px-3 py-2">
                        {r.notes}
                      </p>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => void handleDelete(r.id)}
                    className="shrink-0 rounded-md p-1 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
