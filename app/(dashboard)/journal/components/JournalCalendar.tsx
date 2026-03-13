'use client';

const MOOD_COLOR: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#6366f1',
};

interface CalendarDay {
  date: string;
  mood: number | null;
}

interface JournalCalendarProps {
  year: number;
  month: number;
  entryDates: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function JournalCalendar({
  year, month, entryDates, selectedDate, onSelectDate, onPrev, onNext,
}: JournalCalendarProps) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const entryMap = new Map(entryDates.map((e) => [e.date, e.mood]));

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm px-1">‹</button>
        <span className="text-xs font-semibold text-zinc-300">{MONTHS[month - 1]} {year}</span>
        <button onClick={onNext} className="text-zinc-500 hover:text-zinc-200 transition-colors text-sm px-1">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-zinc-600 font-medium">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasEntry = entryMap.has(dateStr);
          const entryMood = entryMap.get(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={[
                'relative flex items-center justify-center h-7 w-7 mx-auto rounded-full text-[11px] transition-all',
                isSelected ? 'bg-indigo-600 text-white font-semibold' :
                  isToday ? 'border border-indigo-500 text-indigo-300' :
                    'text-zinc-400 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              {day}
              {hasEntry && !isSelected && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full"
                  style={{ backgroundColor: entryMood ? MOOD_COLOR[entryMood] : '#6366f1' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
