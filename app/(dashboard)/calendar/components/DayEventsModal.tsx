'use client';

import type { CalendarEvent } from './EventDetailModal';

interface DayEventsModalProps {
  dateStr: string;
  events: CalendarEvent[];
  onClose: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onNewEvent: () => void;
  onViewDay: () => void;
}

const EVENT_COLOR_DOT: Record<string, string> = {
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
};

const SOURCE_COLOR_DOT: Record<string, string> = {
  local: 'bg-indigo-500',
  google: 'bg-blue-500',
  ical: 'bg-purple-500',
};

function getEventDot(event: CalendarEvent): string {
  if (event.color && EVENT_COLOR_DOT[event.color]) return EVENT_COLOR_DOT[event.color];
  return SOURCE_COLOR_DOT[event.source] ?? 'bg-indigo-500';
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function DayEventsModal({ dateStr, events, onClose, onEventClick, onNewEvent, onViewDay }: DayEventsModalProps) {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-[#111114] border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">{formatDay(dateStr)}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Event list */}
        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {sorted.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-zinc-500">No events this day.</p>
          ) : (
            sorted.map((event) => (
              <button
                key={event.id}
                onClick={() => { onEventClick(event); onClose(); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04] transition-colors"
              >
                <span className={['mt-0.5 h-2 w-2 shrink-0 rounded-full', getEventDot(event)].join(' ')} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-100">{event.title}</p>
                  <p className="text-xs text-zinc-500">
                    {event.allDay
                      ? 'All day'
                      : `${new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(event.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                  </p>
                </div>
                <svg className="h-3.5 w-3.5 shrink-0 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-3 py-2.5 flex gap-2">
          <button
            onClick={() => { onViewDay(); onClose(); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-1.5 text-xs text-zinc-300 hover:border-white/[0.1] hover:text-zinc-100 transition-colors"
          >
            View Day
          </button>
          <button
            onClick={() => { onNewEvent(); onClose(); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + New Event
          </button>
        </div>
      </div>
    </div>
  );
}
