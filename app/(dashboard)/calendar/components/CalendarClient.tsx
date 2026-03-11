'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import MonthGrid from './MonthGrid';
import NewEventModal, { type EventFormData } from './NewEventModal';
import EventDetailModal, { type CalendarEvent } from './EventDetailModal';
import ReminderPanel, { type Reminder } from './ReminderPanel';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarClient() {
  const searchParams = useSearchParams();
  const now = new Date();

  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const [newEventDate, setNewEventDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  const fetchEvents = useCallback(async () => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    try {
      const res = await fetch(`/api/calendar/events?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { events: CalendarEvent[] };
        setEvents(data.events);
      }
    } catch {
      // silently fail
    }
  }, [year, month]);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/reminders');
      if (res.ok) {
        const data = (await res.json()) as { reminders: Reminder[] };
        setReminders(data.reminders);
      }
    } catch {
      // silently fail
    }
  }, []);

  const checkGoogleConnection = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/google/status');
      if (res.ok) {
        const data = (await res.json()) as { connected: boolean };
        setGoogleConnected(data.connected);
      } else {
        setGoogleConnected(false);
      }
    } catch {
      setGoogleConnected(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchReminders(), checkGoogleConnection()]);
      setLoading(false);
    };
    void load();
  }, [fetchEvents, fetchReminders, checkGoogleConnection]);

  // Handle ?connected=true from Google callback
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setGoogleConnected(true);
      setSyncMessage('Google Calendar connected!');
      setTimeout(() => setSyncMessage(''), 4000);
    }
  }, [searchParams]);

  const prevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleDayClick = (date: string) => {
    setNewEventDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCreateEvent = async (data: EventFormData) => {
    const res = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        start: data.start,
        end: data.end,
        allDay: data.allDay,
        color: data.color,
        recurrence: data.recurrence || undefined,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to create event');
    }

    const json = (await res.json()) as { event: CalendarEvent };
    setEvents((prev) => [...prev, json.event]);
    setNewEventDate(null);
  };

  const handleDeleteEvent = async (id: string) => {
    const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Failed to delete event');
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  };

  const handleGoogleConnect = async () => {
    setConnectingGoogle(true);
    try {
      const res = await fetch('/api/calendar/google/connect');
      if (!res.ok) {
        setSyncMessage('Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.');
        setTimeout(() => setSyncMessage(''), 6000);
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setSyncMessage(data.error ?? 'Failed to get Google auth URL');
        setTimeout(() => setSyncMessage(''), 4000);
      }
    } catch {
      setSyncMessage('Failed to connect Google Calendar');
      setTimeout(() => setSyncMessage(''), 4000);
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar? This will remove all synced events.')) return;
    try {
      const res = await fetch('/api/calendar/google/disconnect', { method: 'DELETE' });
      if (res.ok) {
        setGoogleConnected(false);
        setEvents((prev) => prev.filter((e) => e.source !== 'google'));
        setSyncMessage('Google Calendar disconnected');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch {
      setSyncMessage('Failed to disconnect');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/calendar/google/sync', { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as { synced: number };
        setSyncMessage(`Synced ${data.synced} events`);
        await fetchEvents();
      } else {
        setSyncMessage('Sync failed');
      }
    } catch {
      setSyncMessage('Sync failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  };

  const handleImportIcs = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/calendar/import', { method: 'POST', body: formData });
      if (res.ok) {
        const data = (await res.json()) as { imported: number };
        setSyncMessage(`Imported ${data.imported} events`);
        await fetchEvents();
      } else {
        const err = (await res.json()) as { error?: string };
        setSyncMessage(err.error ?? 'Import failed');
      }
    } catch {
      setSyncMessage('Import failed');
    }
    setTimeout(() => setSyncMessage(''), 5000);
  };

  const handleAddReminder = async (data: { title: string; dueAt: string; repeat?: string }) => {
    const res = await fetch('/api/calendar/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = (await res.json()) as { reminder: Reminder };
      setReminders((prev) => [...prev, json.reminder].sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
      ));
    }
  };

  const handleToggleDone = async (id: string, done: boolean) => {
    const res = await fetch(`/api/calendar/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    if (res.ok) {
      const json = (await res.json()) as { reminder: Reminder };
      setReminders((prev) => prev.map((r) => (r.id === id ? json.reminder : r)));
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const res = await fetch(`/api/calendar/reminders/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      {/* Left sidebar */}
      <div className="flex w-60 shrink-0 flex-col border-r border-zinc-800">
        {/* Sidebar header */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Reminders</h2>
        </div>

        {/* Reminders list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <ReminderPanel
            reminders={reminders}
            onToggleDone={(id, done) => void handleToggleDone(id, done)}
            onDelete={(id) => void handleDeleteReminder(id)}
            onAdd={handleAddReminder}
          />
        </div>

        {/* Google Calendar connect/disconnect */}
        <div className="border-t border-zinc-800 p-3">
          {googleConnected ? (
            <button
              onClick={() => void handleGoogleDisconnect()}
              className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-red-600/50 hover:text-red-400 transition-colors"
            >
              Disconnect Google
            </button>
          ) : (
            <button
              onClick={() => void handleGoogleConnect()}
              disabled={connectingGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              {connectingGoogle ? 'Connecting…' : 'Connect Google'}
            </button>
          )}
        </div>
      </div>

      {/* Main calendar area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h1 className="ml-1 text-base font-semibold text-zinc-100">
              {MONTH_NAMES[month - 1]} {year}
            </h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {syncMessage && (
              <span className="text-xs text-zinc-400 animate-pulse">{syncMessage}</span>
            )}

            {/* Import .ics */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportIcs(file);
                // Reset so same file can be re-imported
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            >
              Import .ics
            </button>

            {/* Sync button (only if Google connected) */}
            {googleConnected && (
              <button
                onClick={() => void handleSync()}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-blue-400 hover:border-blue-500/40 hover:text-blue-300 disabled:opacity-50 transition-colors"
              >
                <svg
                  className={['h-3.5 w-3.5', syncing ? 'animate-spin' : ''].join(' ')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
            )}

            {/* New event */}
            <button
              onClick={() => {
                const today = new Date();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                setNewEventDate(`${today.getFullYear()}-${m}-${d}`);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + New Event
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
          </div>
        ) : (
          <MonthGrid
            year={year}
            month={month}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* New Event Modal */}
      {newEventDate && (
        <NewEventModal
          initialDate={newEventDate}
          onSave={handleCreateEvent}
          onClose={() => setNewEventDate(null)}
        />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}
