'use client';

import { useState } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color?: string | null;
  source: string;
  googleId?: string | null;
  recurrence?: string | null;
}

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (event: CalendarEvent) => void;
}

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  local: { label: 'Local', className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
  google: { label: 'Google', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  ical: { label: 'iCal', className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
};

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    const d = new Date(event.start);
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  const start = new Date(event.start);
  const end = new Date(event.end);
  const dateStr = start.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `${dateStr} · ${startTime} – ${endTime}`;
}

export default function EventDetailModal({ event, onClose, onDelete, onEdit }: EventDetailModalProps) {
  const [deleting, setDeleting] = useState(false);
  const isLocal = event.source === 'local';
  const badge = SOURCE_BADGES[event.source] ?? SOURCE_BADGES.local;

  const handleDelete = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(event.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#0f0f12] p-6 shadow-2xl ring-1 ring-zinc-800/60">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-zinc-100 leading-tight">{event.title}</h2>
            <span className={['mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', badge.className].join(' ')}>
              {badge.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Date / Time */}
          <div className="flex items-start gap-2.5">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-zinc-300">{formatEventTime(event)}</p>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-zinc-300">{event.location}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{event.description}</p>
            </div>
          )}

          {/* Recurrence */}
          {event.recurrence && (
            <div className="flex items-center gap-2.5">
              <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-xs text-zinc-500">Recurring event</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex gap-2">
          {isLocal ? (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600/20 border border-red-600/30 py-2 text-sm text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          ) : (
            <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 text-center text-xs text-zinc-500">
              {event.source === 'google' ? 'Edit in Google Calendar' : 'Imported from iCal — read only'}
            </div>
          )}
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
