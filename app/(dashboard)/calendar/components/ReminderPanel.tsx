'use client';

import { useState } from 'react';

export interface Reminder {
  id: string;
  title: string;
  notes?: string | null;
  dueAt: string;
  done: boolean;
  repeat?: string | null;
  eventId?: string | null;
}

interface ReminderPanelProps {
  reminders: Reminder[];
  onToggleDone: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onAdd: (data: { title: string; notes?: string; dueAt: string; repeat?: string }) => void | Promise<void>;
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

  if (eventDay.getTime() === today.getTime()) return `Today ${timeStr}`;
  if (eventDay.getTime() === tomorrow.getTime()) return `Tomorrow ${timeStr}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
}

function isOverdue(dateStr: string, done: boolean): boolean {
  if (done) return false;
  return new Date(dateStr) < new Date();
}

export default function ReminderPanel({ reminders, onToggleDone, onDelete, onAdd }: ReminderPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [newRepeat, setNewRepeat] = useState('none');
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const dueAt = new Date(`${newDate}T${newTime}`).toISOString();
      await onAdd({
        title: newTitle.trim(),
        notes: newNotes.trim() || undefined,
        dueAt,
        repeat: newRepeat === 'none' ? undefined : newRepeat,
      });
      setNewTitle('');
      setNewNotes('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const pending = reminders.filter((r) => !r.done);
  const done = reminders.filter((r) => r.done);

  return (
    <div className="flex flex-col gap-1">
      {/* Pending reminders */}
      {pending.length === 0 && !showForm && (
        <p className="px-1 py-2 text-[11px] text-zinc-600">No upcoming reminders</p>
      )}

      {pending.map((r) => {
        const overdue = isOverdue(r.dueAt, r.done);
        const expanded = expandedId === r.id;
        return (
          <div
            key={r.id}
            className="group rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-start gap-2 px-2 py-1.5">
              {/* Done checkbox — marks done → deletes */}
              <button
                onClick={() => onToggleDone(r.id, true)}
                className={[
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  overdue
                    ? 'border-red-500/60 hover:border-red-400 hover:bg-red-500/20'
                    : 'border-zinc-600 hover:border-indigo-400 hover:bg-indigo-500/20',
                ].join(' ')}
                title="Mark done"
              >
                <span className="sr-only">Mark done</span>
              </button>
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : r.id)}
              >
                <p className={['truncate text-xs font-medium', overdue ? 'text-red-400' : 'text-zinc-200'].join(' ')}>
                  {r.title}
                </p>
                <p className={['text-[10px]', overdue ? 'text-red-500' : 'text-zinc-500'].join(' ')}>
                  {overdue ? 'Overdue · ' : ''}{formatDue(r.dueAt)}
                  {r.repeat && r.repeat !== 'none' && (
                    <span className="ml-1 rounded bg-zinc-800 px-1 py-px text-[9px] text-zinc-400">
                      {REPEAT_LABELS[r.repeat] ?? r.repeat}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onDelete(r.id)}
                className="hidden shrink-0 text-zinc-600 hover:text-red-400 transition-colors group-hover:block text-xs"
                title="Delete"
              >
                ×
              </button>
            </div>
            {/* Notes (expandable) */}
            {expanded && r.notes && (
              <div className="px-8 pb-2">
                <p className="text-[10px] text-zinc-500 whitespace-pre-wrap">{r.notes}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Completed reminders */}
      {done.length > 0 && (
        <div className="mt-2 border-t border-zinc-800/60 pt-1">
          <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Completed</p>
          {done.map((r) => (
            <div
              key={r.id}
              className="group flex items-start gap-2 rounded-lg px-2 py-1.5 opacity-50 hover:opacity-80 transition-opacity"
            >
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-700">
                <svg className="h-2.5 w-2.5 text-zinc-400" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 3 4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-zinc-500 line-through">{r.title}</p>
                <p className="text-[10px] text-zinc-600">{formatDue(r.dueAt)}</p>
              </div>
              <button
                onClick={() => onDelete(r.id)}
                className="hidden shrink-0 text-zinc-600 hover:text-red-400 transition-colors group-hover:block text-xs"
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add reminder inline form */}
      {showForm && (
        <div className="mt-1 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowForm(false); }}
            placeholder="Reminder title…"
            className="w-full rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)…"
            rows={2}
            className="w-full resize-none rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex gap-1.5">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-20 rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>
          <select
            value={newRepeat}
            onChange={(e) => setNewRepeat(e.target.value)}
            className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <div className="flex gap-1.5">
            <button
              onClick={() => void handleSubmit()}
              disabled={saving || !newTitle.trim()}
              className="flex-1 rounded-md bg-indigo-600 py-1 text-[11px] font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Add'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-md bg-zinc-800 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-500 hover:text-indigo-400 transition-colors"
        >
          <span className="text-sm leading-none">+</span>
          Add Reminder
        </button>
      )}
    </div>
  );
}
