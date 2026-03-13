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

// ─── PIN Lock Screen ──────────────────────────────────────────────────────────

function PinLockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  // Normal PIN unlock state
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Recovery flow state
  const [recoveryStep, setRecoveryStep] = useState<'none' | 'choose' | 'sent' | 'verify'>('none');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'sms' | null>(null);
  const [recoveryMasked, setRecoveryMasked] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const resetRecovery = () => {
    setRecoveryStep('none');
    setRecoveryMethod(null);
    setRecoveryMasked('');
    setOtpInput('');
    setNewPinInput('');
    setRecoveryError('');
    setRecoveryLoading(false);
    setRecoverySuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || submitting || blocked) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/journal/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.status === 429) {
        setBlocked(true);
        setError('Too many attempts. Please try again later.');
        setPin('');
        return;
      }

      const data = (await res.json()) as { success: boolean; attemptsLeft?: number };

      if (data.success) {
        onUnlocked();
      } else {
        const left = data.attemptsLeft ?? 0;
        setAttemptsLeft(left);
        if (left === 0) {
          setBlocked(true);
          setError('Too many attempts. Please try again later.');
        } else {
          setError(`Wrong PIN — ${left} attempt${left === 1 ? '' : 's'} left`);
        }
        setPin('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRecovery = async (method: 'email' | 'sms') => {
    setRecoveryMethod(method);
    setRecoveryError('');
    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/pin-recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinType: 'journal', method }),
      });
      const data = (await res.json()) as {
        success: boolean;
        method?: string;
        maskedEmail?: string;
        maskedPhone?: string;
        error?: string;
      };
      if (data.success) {
        const masked = method === 'email' ? (data.maskedEmail ?? '') : (data.maskedPhone ?? '');
        setRecoveryMasked(masked);
        setRecoveryStep('verify');
      } else {
        setRecoveryError(data.error ?? 'Failed to send code. Please try again.');
      }
    } catch {
      setRecoveryError('Something went wrong. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || !newPinInput || recoveryLoading) return;
    setRecoveryError('');
    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/pin-recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput, newPin: newPinInput }),
      });
      const data = (await res.json()) as { success: boolean; pinType?: string; error?: string };
      if (data.success) {
        setRecoverySuccess(true);
      } else {
        setRecoveryError(data.error ?? 'Invalid code or PIN. Please try again.');
      }
    } catch {
      setRecoveryError('Something went wrong. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // ── Recovery: success state ──────────────────────────────────────────────────
  const renderRecoverySuccess = () => (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <svg className="h-7 w-7 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-100">PIN reset!</p>
        <p className="mt-1 text-xs text-zinc-500">You can now log in with your new PIN.</p>
      </div>
      <button
        onClick={resetRecovery}
        className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.98] transition-all"
      >
        Back to login
      </button>
    </div>
  );

  // ── Recovery: step — choose method ──────────────────────────────────────────
  const renderChooseMethod = () => (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-zinc-400">How would you like to recover?</p>
      <button
        onClick={() => void handleRequestRecovery('email')}
        disabled={recoveryLoading}
        className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-xl">📧</span>
        <div>
          <p className="text-sm font-medium text-zinc-100">Send code to email</p>
          <p className="text-xs text-zinc-500">6-digit code sent to your account email</p>
        </div>
      </button>
      <button
        onClick={() => void handleRequestRecovery('sms')}
        disabled={recoveryLoading}
        className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-xl">📱</span>
        <div>
          <p className="text-sm font-medium text-zinc-100">Send code via SMS</p>
          <p className="text-xs text-zinc-500">6-digit code sent to your phone number</p>
        </div>
      </button>
      {recoveryLoading && (
        <div className="flex justify-center pt-1">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}
      {recoveryError && (
        <p className="text-center text-xs font-medium text-rose-400">{recoveryError}</p>
      )}
    </div>
  );

  // ── Recovery: step — enter OTP + new PIN ────────────────────────────────────
  const renderVerifyStep = () => (
    <form onSubmit={(e) => void handleVerifyRecovery(e)} className="flex flex-col gap-4">
      {recoveryMasked && (
        <p className="text-center text-xs text-zinc-400">
          Code sent to <span className="font-mono text-zinc-200">{recoveryMasked}</span>
        </p>
      )}

      {/* OTP input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400">Enter the 6-digit code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otpInput}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setOtpInput(val);
            if (recoveryError) setRecoveryError('');
          }}
          placeholder="000000"
          autoFocus
          className={[
            'w-full rounded-xl border bg-[#0e0e12] py-3 text-center font-mono text-2xl tracking-[0.4em] text-zinc-100 outline-none transition-all placeholder-zinc-700',
            recoveryError
              ? 'border-rose-500/60 ring-2 ring-rose-500/20'
              : 'border-white/[0.08] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
          ].join(' ')}
        />
      </div>

      {/* New PIN input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-400">New PIN (4–6 digits)</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={newPinInput}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setNewPinInput(val);
            if (recoveryError) setRecoveryError('');
          }}
          placeholder="••••"
          className={[
            'w-full rounded-xl border bg-[#0e0e12] py-3 text-center font-mono text-2xl tracking-[0.5em] text-zinc-100 outline-none transition-all placeholder-zinc-700',
            recoveryError
              ? 'border-rose-500/60 ring-2 ring-rose-500/20'
              : 'border-white/[0.08] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
          ].join(' ')}
        />
      </div>

      {recoveryError && (
        <p className="text-center text-xs font-medium text-rose-400">{recoveryError}</p>
      )}

      <button
        type="submit"
        disabled={otpInput.length !== 6 || newPinInput.length < 4 || recoveryLoading}
        className={[
          'w-full rounded-xl py-2.5 text-sm font-semibold transition-all',
          otpInput.length === 6 && newPinInput.length >= 4 && !recoveryLoading
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]'
            : 'bg-indigo-600/30 text-indigo-400/50 cursor-not-allowed',
        ].join(' ')}
      >
        {recoveryLoading ? 'Resetting…' : 'Reset PIN'}
      </button>
    </form>
  );

  // ── Render recovery card contents ────────────────────────────────────────────
  const renderRecoveryBody = () => {
    if (recoverySuccess) return renderRecoverySuccess();
    if (recoveryStep === 'choose') return renderChooseMethod();
    if (recoveryStep === 'verify') return renderVerifyStep();
    return null;
  };

  const isInRecovery = recoveryStep !== 'none';

  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#09090b]">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#111114] px-8 py-10 shadow-2xl shadow-black/60">

          {isInRecovery ? (
            /* ── Recovery flow ─────────────────────────────────────────────── */
            <>
              {/* Back arrow + title row */}
              <div className="mb-6 flex items-center gap-3">
                {!recoverySuccess && (
                  <button
                    onClick={resetRecovery}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-white/[0.16] hover:text-zinc-200"
                    aria-label="Back to PIN login"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                )}
                <h1 className="text-base font-bold tracking-tight text-zinc-100">
                  {recoverySuccess ? 'PIN Reset' : 'Recover access'}
                </h1>
              </div>

              {renderRecoveryBody()}
            </>
          ) : (
            /* ── Normal PIN unlock ─────────────────────────────────────────── */
            <>
              {/* Lock icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                  <svg
                    className="h-8 w-8 text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </div>
              </div>

              {/* Headings */}
              <h1 className="mb-1.5 text-center text-lg font-bold tracking-tight text-zinc-100">
                Journal is locked
              </h1>
              <p className="mb-8 text-center text-sm text-zinc-500">
                Enter your PIN to continue
              </p>

              {/* Form */}
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div className="flex justify-center">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      // Allow digits only
                      const val = e.target.value.replace(/\D/g, '');
                      setPin(val);
                      if (error) setError(null);
                    }}
                    placeholder="••••"
                    disabled={submitting || blocked}
                    autoFocus
                    className={[
                      'w-40 rounded-xl border bg-[#0e0e12] py-3 text-center font-mono text-2xl tracking-[0.5em] text-zinc-100 outline-none transition-all placeholder-zinc-700',
                      error
                        ? 'border-rose-500/60 ring-2 ring-rose-500/20'
                        : 'border-white/[0.08] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
                      (submitting || blocked) ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                  />
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-center text-xs font-medium text-rose-400">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={pin.length < 4 || submitting || blocked}
                  className={[
                    'w-full rounded-xl py-2.5 text-sm font-semibold transition-all',
                    pin.length >= 4 && !submitting && !blocked
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]'
                      : 'bg-indigo-600/30 text-indigo-400/50 cursor-not-allowed',
                  ].join(' ')}
                >
                  {submitting ? 'Verifying…' : 'Unlock'}
                </button>

                {/* Forgot PIN link */}
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep('choose')}
                    className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300 transition-colors"
                  >
                    Forgot PIN?
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Journal Client ──────────────────────────────────────────────────────

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

  // PIN gate state
  const [pinChecked, setPinChecked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Check PIN status on mount
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/journal/pin');
        if (res.ok) {
          const data = (await res.json()) as { hasPin: boolean };
          setHasPin(data.hasPin);
        }
      } finally {
        setPinChecked(true);
      }
    })();
  }, []);

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
    // Only fetch entries once PIN is cleared
    if (!pinChecked) return;
    if (hasPin && !unlocked) return;
    void fetchEntries();
  }, [month, year, activeTag, pinChecked, hasPin, unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (!pinChecked) return;
    if (hasPin && !unlocked) return;
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

  // ── Render: waiting for PIN check ──────────────────────────────────────────
  if (!pinChecked) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#09090b]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // ── Render: PIN lock screen ────────────────────────────────────────────────
  if (hasPin && !unlocked) {
    return <PinLockScreen onUnlocked={() => setUnlocked(true)} />;
  }

  // ── Render: journal content ────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl bg-[#09090b]">
      {/* Left panel */}
      <div className="flex w-72 shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e12]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
          <h2 className="text-sm font-bold tracking-tight text-zinc-100">Journal</h2>
          <button
            onClick={() => void handleNewEntry()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New
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
