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
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
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
      const timerId = setTimeout(() => setSyncMessage(''), 4000);
      return () => clearTimeout(timerId);
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
  const handleDayViewClick = (date: string) => {
    setCurrentDate(new Date(date + 'T12:00:00'));
    setView('day');
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

  const handleUpdateEvent = async (data: EventFormData) => {
    if (!editingEvent) return;
    const res = await fetch(`/api/calendar/events/${editingEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        start: data.start,
        end: data.end,
        allDay: data.allDay,
        color: data.color,
        recurrence: data.recurrence || null,
      }),
    });
    if (!res.ok) throw new Error('Failed to update event');
    const json = (await res.json()) as { event: CalendarEvent };
    setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? json.event : e)));
    setEditingEvent(null);
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
    <div className="flex flex-col md:flex-row h-[calc(100dvh-10rem)] md:h-[calc(100vh-8rem)] overflow-hidden rounded-xl bg-[#09090b]">
      {/* Left sidebar — desktop only */}
      <div className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e12]">
        {/* Today widget */}
        <div className="border-b border-white/[0.06] px-4 py-5">
          <p className="text-xs font-medium text-zinc-500">
            {now.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="mt-0.5 text-4xl font-semibold tracking-tight text-zinc-100 tabular-nums">{now.getDate()}</p>
          <p className="text-xs text-zinc-500">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-xs font-medium text-zinc-500">Reminders</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <ReminderPanel
            reminders={reminders}
            onToggleDone={(id, done) => void handleToggleDone(id, done)}
            onDelete={(id) => void handleDeleteReminder(id)}
            onAdd={handleAddReminder}
          />
        </div>
        <div className="border-t border-white/[0.06] p-3 flex flex-col gap-2">
          {googleConnected ? (
            <button
              onClick={() => void handleGoogleDisconnect()}
              className="w-full rounded-lg bg-white/[0.06] px-3 py-2.5 text-xs font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              Disconnect Google
            </button>
          ) : (
            <button
              onClick={() => void handleGoogleConnect()}
              disabled={connectingGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/[0.1] hover:text-white disabled:opacity-50 transition-colors"
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
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
          {/* Navigation */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {view !== 'month' && (
              <button
                onClick={() => {
                  setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
                  setView('month');
                }}
                className="hidden md:flex rounded-lg bg-white/[0.06] items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-100 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Month
              </button>
            )}
            <button
              onClick={handlePrev}
              className="rounded-lg bg-white/[0.06] p-1.5 text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-100 transition-colors"
              aria-label="Previous"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="rounded-xl bg-indigo-600/10 px-2.5 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-600/20 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-white/[0.06] p-1.5 text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-100 transition-colors"
              aria-label="Next"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h1 className="ml-1 text-sm font-semibold text-zinc-100 truncate">{headerLabel}</h1>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {syncMessage && (
              <span className="hidden md:inline text-xs text-zinc-400 animate-pulse">{syncMessage}</span>
            )}

            {/* View switcher — hidden on mobile (month only) */}
            <div className="hidden md:flex rounded-lg bg-white/[0.06] p-0.5 gap-0.5">
              {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    const d = new Date();
                    if (v === 'month') {
                      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                    } else {
                      setCurrentDate(d);
                    }
                    setView(v);
                  }}
                  className={[
                    'rounded-lg px-3 py-1 text-xs capitalize transition-all',
                    view === v ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Import .ics — desktop only */}
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
              className="hidden md:block rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200 transition-colors"
            >
              Import .ics
            </button>

            {/* Sync — desktop only */}
            {googleConnected && (
              <button
                onClick={() => void handleSync()}
                disabled={syncing}
                className="hidden md:flex rounded-lg bg-indigo-500/10 items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
              >
                <svg
                  className={['h-3.5 w-3.5', syncing ? 'animate-spin' : ''].join(' ')}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
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
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + <span className="hidden sm:inline">New Event</span><span className="sm:hidden">Event</span>
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
            onDayViewClick={handleDayViewClick}
          />
        ) : view === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
            onShowDayEvents={handleShowDayEvents}
            onDayViewClick={handleDayViewClick}
          />
        ) : (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* Mobile reminders strip — shown below calendar on small screens */}
      <div className="md:hidden border-t border-white/[0.06] bg-[#0e0e12] overflow-y-auto max-h-48">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reminders</h2>
          <span className="text-[10px] text-zinc-600">{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="px-3 pb-3">
          <ReminderPanel
            reminders={reminders}
            onToggleDone={(id, done) => void handleToggleDone(id, done)}
            onDelete={(id) => void handleDeleteReminder(id)}
            onAdd={handleAddReminder}
          />
        </div>
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
          onEdit={(event) => { setSelectedEvent(null); setEditingEvent(event); }}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <NewEventModal
          initialDate={new Date(editingEvent.start).toLocaleDateString('en-CA')}
          initialValues={{
            title: editingEvent.title,
            description: editingEvent.description ?? '',
            location: editingEvent.location ?? '',
            start: editingEvent.start,
            end: editingEvent.end,
            allDay: editingEvent.allDay,
            color: editingEvent.color ?? 'indigo',
            recurrence: editingEvent.recurrence ?? '',
          }}
          onSave={async () => {}}
          onUpdate={handleUpdateEvent}
          onClose={() => setEditingEvent(null)}
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
          onViewDay={() => handleDayViewClick(dayEventsDate)}
        />
      )}
    </div>
  );
}
