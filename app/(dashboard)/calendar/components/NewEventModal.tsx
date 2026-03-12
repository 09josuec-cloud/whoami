'use client';

import { useState } from 'react';

interface NewEventModalProps {
  initialDate: string;
  onSave: (data: EventFormData) => Promise<void>;
  onClose: () => void;
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  recurrence: string;
}

const COLOR_OPTIONS = [
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { value: 'green', label: 'Green', bg: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-400' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500' },
  { value: 'red', label: 'Red', bg: 'bg-red-500' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500' },
];

function toLocalDateTimeValue(dateStr: string, time: string): string {
  return `${dateStr}T${time}`;
}

export default function NewEventModal({ initialDate, onSave, onClose }: NewEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('indigo');
  const [recurrence, setRecurrence] = useState('none');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError('');
    setSaving(true);

    try {
      let start: string;
      let end: string;

      if (allDay) {
        start = new Date(`${date}T00:00:00`).toISOString();
        end = new Date(`${date}T23:59:59`).toISOString();
      } else {
        start = new Date(toLocalDateTimeValue(date, startTime)).toISOString();
        end = new Date(toLocalDateTimeValue(date, endTime)).toISOString();
      }

      await onSave({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start,
        end,
        allDay,
        color,
        recurrence: recurrence === 'none' ? '' : recurrence,
      });
    } catch {
      setError('Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#0f0f12] p-6 shadow-2xl ring-1 ring-zinc-800/60">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">New Event</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Title */}
          <div>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
              placeholder="Event title *"
              className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500 border border-zinc-800"
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
            />
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              All day
            </label>
          </div>

          {/* Time */}
          {!allDay && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    const t = e.target.value;
                    setStartTime(t);
                    const [h, m] = t.split(':').map(Number);
                    const endH = (h + 1) % 24;
                    setEndTime(`${String(endH).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`);
                  }}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                />
                <span className="text-zinc-600 text-xs">to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>
            </div>
          )}

          {/* Location */}
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* Color picker */}
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Color</p>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={[
                    'h-6 w-6 rounded-full transition-all',
                    c.bg,
                    color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : 'opacity-60 hover:opacity-100',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">No recurrence</option>
              <option value="RRULE:FREQ=DAILY">Daily</option>
              <option value="RRULE:FREQ=WEEKLY">Weekly</option>
              <option value="RRULE:FREQ=MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => void handleSubmit()}
            disabled={saving || !title.trim()}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Create Event'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
