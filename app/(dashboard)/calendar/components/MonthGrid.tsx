'use client';

import type { CalendarEvent } from './EventDetailModal';

interface MonthGridProps {
  year: number;
  month: number; // 1-indexed
  events: CalendarEvent[];
  onDayClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onShowDayEvents: (date: string) => void;
  onDayViewClick: (date: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500/80 text-indigo-100',
  blue: 'bg-blue-500/80 text-blue-100',
  green: 'bg-green-500/80 text-green-100',
  yellow: 'bg-yellow-400/80 text-yellow-900',
  orange: 'bg-orange-500/80 text-orange-100',
  red: 'bg-red-500/80 text-red-100',
  purple: 'bg-purple-500/80 text-purple-100',
  teal: 'bg-teal-500/80 text-teal-100',
  pink: 'bg-pink-500/80 text-pink-100',
};

const SOURCE_COLOR_MAP: Record<string, string> = {
  local: 'bg-indigo-500/80 text-indigo-100',
  google: 'bg-blue-500/80 text-blue-100',
  ical: 'bg-purple-500/80 text-purple-100',
};

function getEventColor(event: CalendarEvent): string {
  if (event.color && EVENT_COLOR_MAP[event.color]) {
    return EVENT_COLOR_MAP[event.color];
  }
  return SOURCE_COLOR_MAP[event.source] ?? EVENT_COLOR_MAP.indigo;
}

function toDateStr(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getEventsForDay(events: CalendarEvent[], dateStr: string): CalendarEvent[] {
  return events.filter((e) => {
    const eventDate = new Date(e.start).toLocaleDateString('en-CA'); // YYYY-MM-DD
    return eventDate === dateStr;
  });
}

export default function MonthGrid({ year, month, events, onDayClick, onEventClick, onShowDayEvents, onDayViewClick }: MonthGridProps) {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');

  // First day of month (0 = Sun)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  // Build grid cells: 6 rows x 7 cols = 42 cells
  const cells: Array<{ day: number; month: 'prev' | 'current' | 'next'; dateStr: string }> = [];

  // Previous month overflow
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    cells.push({ day, month: 'prev', dateStr: toDateStr(prevYear, prevMonth, day) });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: 'current', dateStr: toDateStr(year, month, d) });
  }

  // Next month overflow
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cells.push({ day: d, month: 'next', dateStr: toDateStr(nextYear, nextMonth, d) });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-zinc-800/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid flex-1 grid-cols-7" style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}>
        {cells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isCurrent = cell.month === 'current';
          const dayEvents = isCurrent ? getEventsForDay(events, cell.dateStr) : [];

          return (
            <div
              key={idx}
              onClick={() => isCurrent && onDayClick(cell.dateStr)}
              className={[
                'flex flex-col overflow-hidden border-b border-r border-zinc-800/30 px-1 pt-1 pb-0.5 transition-colors',
                isCurrent ? 'cursor-pointer hover:bg-zinc-800/40' : 'cursor-default',
              ].join(' ')}
            >
              {/* Day number — click goes to day view */}
              <div className="mb-0.5 flex items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); if (isCurrent) onDayViewClick(cell.dateStr); }}
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                    isToday
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : isCurrent
                      ? 'text-zinc-200 hover:bg-zinc-700'
                      : 'text-zinc-700 cursor-default',
                  ].join(' ')}
                  title={isCurrent ? 'View day' : undefined}
                >
                  {cell.day}
                </button>
              </div>

              {/* Event pills */}
              <div className="flex flex-col gap-px overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={[
                      'w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium leading-4 transition-opacity hover:opacity-80',
                      getEventColor(event),
                    ].join(' ')}
                    title={event.title}
                  >
                    {event.allDay ? '' : new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' '}
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowDayEvents(cell.dateStr);
                    }}
                    className="truncate rounded px-1 py-px text-left text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
