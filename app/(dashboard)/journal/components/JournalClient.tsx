'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import EntryList from './EntryList';
import JournalCalendar from './JournalCalendar';
import type { EntryData } from './EntryEditor';

// Dynamic import to avoid SSR issues with TipTap
const EntryEditor = dynamic(() => import('./EntryEditor'), { ssr: false });

const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

interface Entry {
  id: string;
  title?: string | null;
  content: string;
  mood?: number | null;
  tags: string[];
  locked: boolean;
  entryDate: string;
  updatedAt: string;
}

export default function JournalClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDates, setCalendarDates] = useState<{ date: string; mood: number | null }[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (activeTag) params.set('tag', activeTag);
      if (search) params.set('q', search);

      const [entriesRes, calRes, tagsRes] = await Promise.all([
        fetch(`/api/journal?${params}`),
        fetch(`/api/journal/calendar?month=${month}&year=${year}`),
        fetch('/api/journal/tags'),
      ]);

      if (entriesRes.ok) {
        const data = (await entriesRes.json()) as { entries: Entry[] };
        setEntries(data.entries);
        // Auto-select first entry if none selected
        if (!selectedId && data.entries.length > 0) {
          setSelectedId(data.entries[0].id);
        }
      }
      if (calRes.ok) {
        const data = (await calRes.json()) as { dates: { date: string; mood: number | null }[] };
        setCalendarDates(data.dates);
      }
      if (tagsRes.ok) {
        const data = (await tagsRes.json()) as { tags: string[] };
        setAllTags(data.tags);
      }
    } finally {
      setLoading(false);
    }
  }, [month, year, activeTag, search, selectedId]);

  useEffect(() => {
    void fetchEntries();
  }, [month, year, activeTag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => void fetchEntries(), 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewEntry = useCallback(async () => {
    const entryDate = selectedDate ?? new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', entryDate }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { entry: Entry };
      setEntries((prev) => [data.entry, ...prev]);
      setSelectedId(data.entry.id);
      setCalendarDates((prev) => {
        const exists = prev.find((d) => d.date === entryDate);
        if (exists) return prev;
        return [...prev, { date: entryDate, mood: null }];
      });
    } catch {
      // ignore
    }
  }, [selectedDate]);

  const handleSave = useCallback(async (data: Partial<EntryData>) => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/journal/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { entry: Entry };
      setEntries((prev) => prev.map((e) => (e.id === selectedId ? json.entry : e)));
      // Update calendar if mood changed
      if (data.mood !== undefined) {
        setCalendarDates((prev) =>
          prev.map((d) =>
            d.date === json.entry.entryDate.slice(0, 10)
              ? { ...d, mood: json.entry.mood ?? null }
              : d,
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  }, [selectedId]);

  const handleDelete = useCallback(async () => {
    if (!selectedId) return;
    const entry = entries.find((e) => e.id === selectedId);
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    try {
      await fetch(`/api/journal/${selectedId}`, { method: 'DELETE' });
      const newEntries = entries.filter((e) => e.id !== selectedId);
      setEntries(newEntries);
      setSelectedId(newEntries[0]?.id ?? null);
      if (entry) {
        setCalendarDates((prev) => prev.filter((d) => d.date !== entry.entryDate.slice(0, 10)));
      }
    } catch {
      // ignore
    }
  }, [selectedId, entries]);

  const handleCalendarDate = useCallback((date: string) => {
    setSelectedDate(date);
    const entry = entries.find((e) => e.entryDate.slice(0, 10) === date);
    if (entry) {
      setSelectedId(entry.id);
    } else {
      setSelectedId(null);
    }
  }, [entries]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const editorEntry: EntryData | null = selectedEntry ? {
    id: selectedEntry.id,
    title: selectedEntry.title ?? '',
    content: selectedEntry.content,
    mood: selectedEntry.mood,
    tags: selectedEntry.tags,
    locked: selectedEntry.locked,
    entryDate: selectedEntry.entryDate,
  } : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl bg-[#09090b]">
      {/* Left panel */}
      <div className="flex w-72 shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e12]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Journal</h2>
          <button
            onClick={() => void handleNewEntry()}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            + New
          </button>
        </div>

        {/* View toggle */}
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => setView('list')}
            className={['flex-1 py-2 text-xs font-medium transition-colors', view === 'list' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'].join(' ')}
          >
            Entries
          </button>
          <button
            onClick={() => setView('calendar')}
            className={['flex-1 py-2 text-xs font-medium transition-colors', view === 'calendar' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'].join(' ')}
          >
            Calendar
          </button>
        </div>

        {view === 'calendar' ? (
          <JournalCalendar
            year={year}
            month={month}
            entryDates={calendarDates}
            selectedDate={selectedDate}
            onSelectDate={handleCalendarDate}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        ) : (
          <>
            {/* Search */}
            <div className="border-b border-white/[0.06] px-3 py-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries…"
                className="w-full rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none ring-1 ring-white/[0.06] focus:ring-indigo-500"
              />
            </div>

            {/* Tags filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-3 py-2">
                <button
                  onClick={() => setActiveTag(null)}
                  className={['rounded-md px-2 py-0.5 text-xs transition-colors', !activeTag ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200'].join(' ')}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={['rounded-md px-2 py-0.5 text-xs transition-colors', activeTag === tag ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200'].join(' ')}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Mood filter row */}
            <div className="flex items-center gap-1 border-b border-white/[0.06] px-3 py-2">
              <span className="text-xs text-zinc-500 mr-1">Mood</span>
              {[1, 2, 3, 4, 5].map((m) => (
                <span key={m} className="text-sm opacity-60 hover:opacity-100 cursor-default">{MOOD_EMOJI[m]}</span>
              ))}
            </div>
          </>
        )}

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800/60" />
              ))}
            </div>
          ) : (
            <EntryList
              entries={entries}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        {/* Stats footer */}
        <div className="border-t border-white/[0.06] px-4 py-2.5 text-xs text-zinc-600">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Right panel — editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {selectedEntry || selectedId === null ? (
          <EntryEditor
            entry={editorEntry}
            onSave={handleSave}
            onDelete={selectedEntry ? handleDelete : undefined}
            onEntryDeleted={() => {
              const newEntries = entries.filter((e) => e.id !== selectedId);
              setEntries(newEntries);
              setSelectedId(newEntries[0]?.id ?? null);
            }}
            saving={saving}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
            Select an entry or click{' '}
            <button onClick={() => void handleNewEntry()} className="mx-1.5 text-indigo-400 hover:text-indigo-300 transition-colors">+ New</button>
            to start writing
          </div>
        )}
      </div>
    </div>
  );
}
