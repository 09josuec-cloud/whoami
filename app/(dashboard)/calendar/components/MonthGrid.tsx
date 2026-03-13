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

const EVENT_COLOR_CLASSES: Record<string, { pill: string; dot: string }> = {
  indigo: { pill: 'bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-500', dot: 'bg-indigo-500' },
  blue:   { pill: 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500',       dot: 'bg-blue-500' },
  green:  { pill: 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-500', dot: 'bg-emerald-500' },
  yellow: { pill: 'bg-yellow-500/20 text-yellow-300 border-l-2 border-yellow-500', dot: 'bg-yellow-400' },
  orange: { pill: 'bg-orange-500/20 text-orange-300 border-l-2 border-orange-500', dot: 'bg-orange-500' },
  red:    { pill: 'bg-red-500/20 text-red-300 border-l-2 border-red-500',          dot: 'bg-red-500' },
  purple: { pill: 'bg-purple-500/20 text-purple-300 border-l-2 border-purple-500', dot: 'bg-purple-500' },
  teal:   { pill: 'bg-teal-500/20 text-teal-300 border-l-2 border-teal-500',       dot: 'bg-teal-500' },
  pink:   { pill: 'bg-pink-500/20 text-pink-300 border-l-2 border-pink-500',       dot: 'bg-pink-500' },
};

const SOURCE_FALLBACK: Record<string, string> = {
  local: 'indigo',
  google: 'blue',
  ical: 'purple',
};

function getEventClasses(event: CalendarEvent): { pill: string; dot: string } {
  const colorKey = event.color ?? SOURCE_FALLBACK[event.source] ?? 'indigo';
  return EVENT_COLOR_CLASSES[colorKey] ?? EVENT_COLOR_CLASSES.indigo;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getEventsForDay(events: CalendarEvent[], dateStr: string): CalendarEvent[] {
  return events.filter((e) => new Date(e.start).toLocaleDateString('en-CA') === dateStr);
}

export default function MonthGrid({ year, month, events, onDayClick, onEventClick, onShowDayEvents, onDayViewClick }: MonthGridProps) {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: Array<{ day: number; month: 'prev' | 'current' | 'next'; dateStr: string; col: number }> = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    cells.push({ day, month: 'prev', dateStr: toDateStr(prevYear, prevMonth, day), col: cells.length % 7 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: 'current', dateStr: toDateStr(year, month, d), col: cells.length % 7 });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cells.push({ day: d, month: 'next', dateStr: toDateStr(nextYear, nextMonth, d), col: cells.length % 7 });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={[
              'py-2.5 text-center text-xs font-medium',
              i === 0 || i === 6 ? 'text-zinc-600' : 'text-zinc-500',
            ].join(' ')}
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
          const isWeekend = cell.col === 0 || cell.col === 6;
          const dayEvents = isCurrent ? getEventsForDay(events, cell.dateStr) : [];

          return (
            <div
              key={idx}
              onClick={() => isCurrent && onDayClick(cell.dateStr)}
              className={[
                'group relative flex flex-col overflow-hidden border-b border-r transition-colors',
                // Base background per cell type
                isToday
                  ? 'bg-indigo-500/[0.06] border-white/[0.06]'
                  : isCurrent && isWeekend
                  ? 'bg-white/[0.01] border-white/[0.04]'
                  : isCurrent
                  ? 'bg-transparent border-white/[0.04]'
                  : 'bg-transparent border-white/[0.03]',
                // Hover
                isCurrent ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default',
              ].join(' ')}
            >
              {/* Today accent top line */}
              {isToday && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}

              <div className="px-1.5 pt-1.5 pb-1">
                {/* Day number */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (isCurrent) onDayViewClick(cell.dateStr); }}
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                    isToday
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40'
                      : isCurrent
                      ? 'text-zinc-200 hover:bg-white/[0.08]'
                      : 'text-zinc-700 cursor-default',
                  ].join(' ')}
                >
                  {cell.day}
                </button>

                {/* Event pills */}
                <div className="mt-0.5 flex flex-col gap-px overflow-hidden">
                  {dayEvents.slice(0, 3).map((event) => {
                    const { pill } = getEventClasses(event);
                    return (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={[
                          'w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium leading-4 transition-opacity hover:opacity-90',
                          pill,
                        ].join(' ')}
                        title={event.title}
                      >
                        {!event.allDay && (
                          <span className="mr-1 opacity-70">
                            {new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                        {event.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onShowDayEvents(cell.dateStr); }}
                      className="px-1.5 py-0.5 text-left text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
