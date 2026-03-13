'use client';

import type { CalendarEvent } from './EventDetailModal';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const EVENT_COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200',
  blue: 'bg-blue-500/20 border-blue-500/60 text-blue-200',
  green: 'bg-green-500/20 border-green-500/60 text-green-200',
  yellow: 'bg-yellow-400/20 border-yellow-400/60 text-yellow-200',
  orange: 'bg-orange-500/20 border-orange-500/60 text-orange-200',
  red: 'bg-red-500/20 border-red-500/60 text-red-200',
  purple: 'bg-purple-500/20 border-purple-500/60 text-purple-200',
};

const SOURCE_COLOR_MAP: Record<string, string> = {
  local: 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200',
  google: 'bg-blue-500/20 border-blue-500/60 text-blue-200',
  ical: 'bg-purple-500/20 border-purple-500/60 text-purple-200',
};

function getEventColor(event: CalendarEvent): string {
  if (event.color && EVENT_COLOR_MAP[event.color]) return EVENT_COLOR_MAP[event.color];
  return SOURCE_COLOR_MAP[event.source] ?? EVENT_COLOR_MAP.indigo;
}

const HOUR_HEIGHT = 56; // px per hour

export default function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const today = new Date();
  const dateStr = currentDate.toLocaleDateString('en-CA');
  const isToday = dateStr === today.toLocaleDateString('en-CA');

  const dayLabel = currentDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const dayEvents = events.filter(
    (e) => new Date(e.start).toLocaleDateString('en-CA') === dateStr,
  );

  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  // Current time indicator
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day header */}
      <div className="border-b border-white/[0.06] px-4 py-2.5">
        <h2 className={['text-sm font-semibold', isToday ? 'text-indigo-300' : 'text-zinc-100'].join(' ')}>
          {isToday && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-indigo-500 align-middle" />}
          {dayLabel}
        </h2>
        {allDayEvents.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {allDayEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onEventClick(e)}
                className={[
                  'rounded border px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80',
                  getEventColor(e),
                ].join(' ')}
              >
                {e.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Hour lines */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-white/[0.06]"
              style={{ top: `${h * HOUR_HEIGHT}px` }}
            >
              <span className="absolute left-2 -translate-y-1/2 text-xs text-zinc-600 select-none">
                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
              </span>
            </div>
          ))}

          {/* Current time line */}
          {isToday && (
            <div
              className="absolute left-14 right-0 z-10 border-t-2 border-red-500"
              style={{ top: `${nowTop}px` }}
            >
              <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
            </div>
          )}

          {/* Events */}
          <div className="absolute left-14 right-2 top-0">
            {timedEvents.map((event) => {
              const start = new Date(event.start);
              const end = new Date(event.end);
              const startMins = start.getHours() * 60 + start.getMinutes();
              const durationMins = Math.max(30, (end.getTime() - start.getTime()) / 60000);
              const top = (startMins / 60) * HOUR_HEIGHT;
              const height = Math.min((durationMins / 60) * HOUR_HEIGHT, 24 * HOUR_HEIGHT - top);

              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  className={[
                    'absolute left-0 right-0 overflow-hidden rounded border-l-2 px-2 py-1 text-left transition-opacity hover:opacity-80',
                    getEventColor(event),
                  ].join(' ')}
                  title={event.title}
                >
                  <p className="truncate text-xs font-medium">{event.title}</p>
                  {height > 30 && (
                    <p className="text-xs opacity-70">
                      {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      {' – '}
                      {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
