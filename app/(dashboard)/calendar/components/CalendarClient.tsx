'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import MonthGrid from './MonthGrid';
import WeekView from './WeekView';
import DayView from './DayView';
import NewEventModal, { type EventFormData } from './NewEventModal';
import EventDetailModal, { type CalendarEvent } from './EventDetailModal';
import DayEventsModal from './DayEventsModal';
import ReminderPanel, { type Reminder } from './ReminderPanel';

type CalendarView = 'month' | 'week' | 'day';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getWeekLabel(date: Date): string {
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startStr = sunday.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const endStr = saturday.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getViewRange(date: Date, view: CalendarView): { start: Date; end: Date } {
  if (view === 'month') {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0, 23, 59, 59),
    };
  }
  if (view === 'week') {
    const day = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    return { start: sunday, end: saturday };
  }
  // day
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function navigate(date: Date, view: CalendarView, dir: number): Date {
  const d = new Date(date);
  if (view === 'month') {
    d.setMonth(d.getMonth() + dir);
    d.setDate(1);
  } else if (view === 'week') {
    d.setDate(d.getDate() + dir * 7);
  } else {
    d.setDate(d.getDate() + dir);
  }
  return d;
}

export default function CalendarClient() {
  const searchParams = useSearchParams();
  const now = new Date();

  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [view, setView] = useState<CalendarView>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const [newEventDate, setNewEventDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dayEventsDate, setDayEventsDate] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSyncedRef = useRef(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchEvents = useCallback(async (forDate?: Date, forView?: CalendarView) => {
    const d = forDate ?? currentDate;
    const v = forView ?? view;
    const { start, end } = getViewRange(d, v);

    // For week/day, also fetch ±1 month to cover navigation
    const fetchStart = v === 'month' ? start : new Date(d.getFullYear(), d.getMonth(), 1);
    const fetchEnd = v === 'month' ? end : new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const params = new URLSearchParams({
      start: fetchStart.toISOString(),
      end: fetchEnd.toISOString(),
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
  }, [currentDate, view]);

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
        return data.connected;
      }
    } catch {
      // ignore
    }
    setGoogleConnected(false);
    return false;
  }, []);

  // Auto-sync Google on initial load (silently, once per session)
  const silentSync = useCallback(async () => {
    if (autoSyncedRef.current) return;
    autoSyncedRef.current = true;
    try {
      const res = await fetch('/api/calendar/google/sync', { method: 'POST' });
      if (res.ok) {
        await fetchEvents();
      }
    } catch {
      // ignore
    }
  }, [fetchEvents]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [, , connected] = await Promise.all([fetchEvents(), fetchReminders(), checkGoogleConnection()]);
      setLoading(false);
      // Auto-sync Google if connected
      if (connected) {
        void silentSync();
      }
    };
    void load();
  }, [fetchEvents, fetchReminders, checkGoogleConnection, silentSync]);

  // Re-fetch events when date/view changes
  useEffect(() => {
    void fetchEvents(currentDate, view);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view]);

  // Handle ?connected=true from Google callback
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setGoogleConnected(true);
      setSyncMessage('Google Calendar connected!');
      setTimeout(() => setSyncMessage(''), 4000);
    }
  }, [searchParams]);

  const handlePrev = () => setCurrentDate((d) => navigate(d, view, -1));
  const handleNext = () => setCurrentDate((d) => navigate(d, view, 1));
  const handleToday = () => {
    const d = new Date();
    if (view === 'month') {
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      setCurrentDate(d);
    }
  };

  const handleDayClick = (date: string) => setNewEventDate(date);
  const handleEventClick = (event: CalendarEvent) => setSelectedEvent(event);
  const handleShowDayEvents = (date: string) => setDayEventsDate(date);

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

    if (!res.ok) throw new Error('Failed to create event');

    const json = (await res.json()) as { event: CalendarEvent };
    setEvents((prev) => [...prev, json.event]);
    setNewEventDate(null);

    // Auto-sync back to Google after creating
    if (googleConnected) {
      void silentSync();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete event');
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  };

  const handleGoogleConnect = async () => {
    setConnectingGoogle(true);
    try {
      const res = await fetch('/api/calendar/google/connect');
      if (!res.ok) {
        setSyncMessage('Google OAuth not configured.');
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
        const err = (await res.json()) as { error?: string };
        setSyncMessage(err.error ?? 'Sync failed');
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

  const handleAddReminder = async (data: { title: string; notes?: string; dueAt: string; repeat?: string }) => {
    const res = await fetch('/api/calendar/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = (await res.json()) as { reminder: Reminder };
      setReminders((prev) =>
        [...prev, json.reminder].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
      );
    }
  };

  // When done=true, auto-delete the reminder
  const handleToggleDone = async (id: string, done: boolean) => {
    if (done) {
      // Mark done = delete it
      const res = await fetch(`/api/calendar/reminders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
      }
    } else {
      const res = await fetch(`/api/calendar/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: false }),
      });
      if (res.ok) {
        const json = (await res.json()) as { reminder: Reminder };
        setReminders((prev) => prev.map((r) => (r.id === id ? json.reminder : r)));
      }
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const res = await fetch(`/api/calendar/reminders/${id}`, { method: 'DELETE' });
    if (res.ok) setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Header label
  let headerLabel = '';
  if (view === 'month') headerLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  else if (view === 'week') headerLabel = getWeekLabel(currentDate);
  else headerLabel = getDayLabel(currentDate);

  // Events for day modal
  const dayEventsForModal = dayEventsDate
    ? events.filter((e) => new Date(e.start).toLocaleDateString('en-CA') === dayEventsDate)
    : [];

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      {/* Left sidebar */}
      <div className="flex w-60 shrink-0 flex-col border-r border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Reminders</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <ReminderPanel
            reminders={reminders}
            onToggleDone={(id, done) => void handleToggleDone(id, done)}
            onDelete={(id) => void handleDeleteReminder(id)}
            onAdd={handleAddReminder}
          />
        </div>
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
              onClick={handlePrev}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
              aria-label="Previous"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
              aria-label="Next"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h1 className="ml-1 text-base font-semibold text-zinc-100">{headerLabel}</h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {syncMessage && (
              <span className="text-xs text-zinc-400 animate-pulse">{syncMessage}</span>
            )}

            {/* View switcher */}
            <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
              {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={[
                    'px-2.5 py-1 text-xs capitalize transition-colors',
                    view === v
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Import .ics */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportIcs(file);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            >
              Import .ics
            </button>

            {/* Sync button */}
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
                const d = view === 'day' ? currentDate : today;
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setNewEventDate(`${d.getFullYear()}-${m}-${day}`);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + New Event
            </button>
          </div>
        </div>

        {/* Calendar view */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
          </div>
        ) : view === 'month' ? (
          <MonthGrid
            year={year}
            month={month}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
            onShowDayEvents={handleShowDayEvents}
          />
        ) : view === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
            onShowDayEvents={handleShowDayEvents}
          />
        ) : (
          <DayView
            currentDate={currentDate}
            events={events}
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

      {/* Day Events Modal */}
      {dayEventsDate && (
        <DayEventsModal
          dateStr={dayEventsDate}
          events={dayEventsForModal}
          onClose={() => setDayEventsDate(null)}
          onEventClick={handleEventClick}
          onNewEvent={() => setNewEventDate(dayEventsDate)}
        />
      )}
    </div>
  );
}
