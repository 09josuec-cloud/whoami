'use client';

import type { CalendarEvent } from './EventDetailModal';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onShowDayEvents: (dateStr: string) => void;
}

const EVENT_COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500/80 text-indigo-100',
  blue: 'bg-blue-500/80 text-blue-100',
  green: 'bg-green-500/80 text-green-100',
  yellow: 'bg-yellow-400/80 text-yellow-900',
  orange: 'bg-orange-500/80 text-orange-100',
  red: 'bg-red-500/80 text-red-100',
  purple: 'bg-purple-500/80 text-purple-100',
};

const SOURCE_COLOR_MAP: Record<string, string> = {
  local: 'bg-indigo-500/80 text-indigo-100',
  google: 'bg-blue-500/80 text-blue-100',
  ical: 'bg-purple-500/80 text-purple-100',
};

function getEventColor(event: CalendarEvent): string {
  if (event.color && EVENT_COLOR_MAP[event.color]) return EVENT_COLOR_MAP[event.color];
  return SOURCE_COLOR_MAP[event.source] ?? EVENT_COLOR_MAP.indigo;
}

function toDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay(); // 0=Sun
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekView({ currentDate, events, onDayClick, onEventClick, onShowDayEvents }: WeekViewProps) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {weekDays.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={i}
              className="flex flex-col items-center py-2 border-r border-zinc-800 last:border-r-0"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {DAY_LABELS[i]}
              </span>
              <button
                onClick={() => onDayClick(dateStr)}
                className={[
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isToday ? 'bg-indigo-600 text-white' : 'text-zinc-200 hover:bg-zinc-800',
                ].join(' ')}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Events per day */}
      <div className="grid flex-1 grid-cols-7 overflow-y-auto">
        {weekDays.map((day, i) => {
          const dateStr = toDateStr(day);
          const dayEvents = events.filter(
            (e) => new Date(e.start).toLocaleDateString('en-CA') === dateStr,
          ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          return (
            <div
              key={i}
              onClick={() => onDayClick(dateStr)}
              className="flex flex-col gap-px border-r border-zinc-800/70 p-1 last:border-r-0 cursor-pointer hover:bg-zinc-900/40 transition-colors min-h-0"
            >
              {dayEvents.slice(0, 5).map((event) => (
                <button
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                  className={[
                    'w-full truncate rounded px-1 py-px text-left text-[10px] font-medium leading-4 transition-opacity hover:opacity-80',
                    getEventColor(event),
                  ].join(' ')}
                  title={event.title}
                >
                  {!event.allDay && (
                    <span className="opacity-70">
                      {new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}{' '}
                    </span>
                  )}
                  {event.title}
                </button>
              ))}
              {dayEvents.length > 5 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShowDayEvents(dateStr); }}
                  className="truncate rounded px-1 py-px text-left text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  +{dayEvents.length - 5} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
