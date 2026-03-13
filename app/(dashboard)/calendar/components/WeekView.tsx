'use client';

import type { CalendarEvent } from './EventDetailModal';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onShowDayEvents: (dateStr: string) => void;
  onDayViewClick: (dateStr: string) => void;
}

const EVENT_COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500/80 border-l-indigo-500 text-indigo-100',
  blue: 'bg-blue-500/80 border-l-blue-500 text-blue-100',
  green: 'bg-green-500/80 border-l-green-500 text-green-100',
  yellow: 'bg-yellow-400/80 border-l-yellow-400 text-yellow-900',
  orange: 'bg-orange-500/80 border-l-orange-500 text-orange-100',
  red: 'bg-red-500/80 border-l-red-500 text-red-100',
  purple: 'bg-purple-500/80 border-l-purple-500 text-purple-100',
  pink: 'bg-pink-500/80 border-l-pink-500 text-pink-100',
};

const SOURCE_COLOR_MAP: Record<string, string> = {
  local: 'bg-indigo-500/80 border-l-indigo-500 text-indigo-100',
  google: 'bg-blue-500/80 border-l-blue-500 text-blue-100',
  ical: 'bg-purple-500/80 border-l-purple-500 text-purple-100',
};

function getEventColor(event: CalendarEvent): string {
  if (event.color && EVENT_COLOR_MAP[event.color]) return EVENT_COLOR_MAP[event.color];
  return SOURCE_COLOR_MAP[event.source] ?? EVENT_COLOR_MAP.indigo;
}

function toDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 56;

export default function WeekView({ currentDate, events, onDayClick, onEventClick, onShowDayEvents, onDayViewClick }: WeekViewProps) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const weekDays = getWeekDays(currentDate);

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;
  const isThisWeek = weekDays.some((d) => toDateStr(d) === todayStr);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers — sticky */}
      <div className="grid shrink-0 border-b border-white/[0.06]" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
        <div className="border-r border-white/[0.06]" /> {/* time column spacer */}
        {weekDays.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={i}
              className="flex flex-col items-center border-r border-white/[0.06] py-2 last:border-r-0"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {DAY_LABELS[i]}
              </span>
              <button
                onClick={() => onDayViewClick(dateStr)}
                className={[
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isToday ? 'bg-indigo-600 text-white' : 'text-zinc-200 hover:bg-white/[0.04]',
                ].join(' ')}
                title="Go to day view"
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px`, display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)' }}>

          {/* Hour labels column */}
          <div className="relative border-r border-white/[0.06]">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <span className="text-xs text-zinc-600 select-none -translate-y-2">
                  {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, colIdx) => {
            const dateStr = toDateStr(day);
            const isToday = dateStr === todayStr;
            const dayEvents = events.filter(
              (e) => new Date(e.start).toLocaleDateString('en-CA') === dateStr,
            );
            const allDayEvents = dayEvents.filter((e) => e.allDay);
            const timedEvents = dayEvents.filter((e) => !e.allDay);

            return (
              <div
                key={colIdx}
                className={[
                  'relative border-r border-white/[0.06] last:border-r-0',
                  isToday ? 'bg-indigo-950/10' : '',
                ].join(' ')}
                onClick={() => onDayClick(dateStr)}
              >
                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-white/[0.04] pointer-events-none"
                    style={{ top: `${h * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* All-day events at top */}
                {allDayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={[
                      'absolute left-0.5 right-0.5 z-10 truncate rounded border-l-2 px-1 py-px text-xs font-medium transition-opacity hover:opacity-80',
                      getEventColor(event),
                    ].join(' ')}
                    style={{ top: '2px' }}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                ))}

                {/* Current time line */}
                {isToday && isThisWeek && (
                  <div
                    className="absolute left-0 right-0 z-20 border-t-2 border-red-500 pointer-events-none"
                    style={{ top: `${nowTop}px` }}
                  >
                    <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Timed events */}
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
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      className={[
                        'absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border-l-2 px-1 py-px text-left transition-opacity hover:opacity-80',
                        getEventColor(event),
                      ].join(' ')}
                      title={event.title}
                    >
                      <p className="truncate text-xs font-medium leading-tight">{event.title}</p>
                      {height > 28 && (
                        <p className="text-xs opacity-70 leading-tight">
                          {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </button>
                  );
                })}

                {/* "+X more" overflow for all-day */}
                {allDayEvents.length > 2 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onShowDayEvents(dateStr); }}
                    className="absolute left-0.5 right-0.5 z-10 rounded px-1 py-px text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    style={{ top: '18px' }}
                  >
                    +{allDayEvents.length - 2} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
