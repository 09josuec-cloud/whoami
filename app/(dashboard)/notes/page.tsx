'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  color: string | null;
  locked: boolean;
  pinAttempts: number;
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS: { label: string; value: string; bg: string; border: string; dot: string }[] = [
  { label: 'Default',  value: '',        bg: 'bg-[#111114]',         border: 'border-white/[0.06]',    dot: 'bg-zinc-600' },
  { label: 'Indigo',   value: 'indigo',  bg: 'bg-indigo-950/50',     border: 'border-indigo-700/40',   dot: 'bg-indigo-500' },
  { label: 'Emerald',  value: 'emerald', bg: 'bg-emerald-950/50',    border: 'border-emerald-700/40',  dot: 'bg-emerald-500' },
  { label: 'Amber',    value: 'amber',   bg: 'bg-amber-950/50',      border: 'border-amber-700/40',    dot: 'bg-amber-500' },
  { label: 'Rose',     value: 'rose',    bg: 'bg-rose-950/50',       border: 'border-rose-700/40',     dot: 'bg-rose-500' },
  { label: 'Purple',   value: 'purple',  bg: 'bg-purple-950/50',     border: 'border-purple-700/40',   dot: 'bg-purple-500' },
];

function getColorConfig(color: string | null) {
  return NOTE_COLORS.find((c) => c.value === (color ?? '')) ?? NOTE_COLORS[0];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-3.5 w-3.5'} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 12V4h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-3.5 w-3.5'} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-8 w-8'} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Session-unlocked note IDs
  const [unlockedNoteIds, setUnlockedNoteIds] = useState<Set<string>>(new Set());

  // PIN unlock modal state
  const [pinModalNote, setPinModalNote] = useState<Note | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [pinEraseMessage, setPinEraseMessage] = useState('');

  // PIN recovery state
  const [noteRecoveryStep, setNoteRecoveryStep] = useState<'none' | 'choose' | 'verify'>('none');
  const [noteRecoveryMethod, setNoteRecoveryMethod] = useState<'email' | 'sms' | null>(null);
  const [noteRecoveryMasked, setNoteRecoveryMasked] = useState('');
  const [noteOtpInput, setNoteOtpInput] = useState('');
  const [noteNewPinInput, setNoteNewPinInput] = useState('');
  const [noteRecoveryError, setNoteRecoveryError] = useState('');
  const [noteRecoveryLoading, setNoteRecoveryLoading] = useState(false);

  // Lock-from-editor modal state
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockPinInput, setLockPinInput] = useState('');
  const [lockPinError, setLockPinError] = useState('');
  const [lockSubmitting, setLockSubmitting] = useState(false);

  // Editor modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Editor field state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const lockPinInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchNotes = useCallback(async (q = '', tag = '') => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tag) params.set('tag', tag);
      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { notes: Note[] };
        setNotes(data.notes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchNotes(); }, [fetchNotes]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { void fetchNotes(search, selectedTag); }, 300);
    return () => clearTimeout(t);
  }, [search, selectedTag, fetchNotes]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editContent, modalOpen]);

  // Close editor modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    if (modalOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus PIN input when PIN modal opens
  useEffect(() => {
    if (pinModalNote) {
      setPinInput('');
      setPinError('');
      setTimeout(() => pinInputRef.current?.focus(), 50);
    }
  }, [pinModalNote]);

  // Focus lock PIN input when lock modal opens
  useEffect(() => {
    if (lockModalOpen) {
      setLockPinInput('');
      setLockPinError('');
      setTimeout(() => lockPinInputRef.current?.focus(), 50);
    }
  }, [lockModalOpen]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openNote = (note: Note) => {
    setActiveNote(note);
    setIsNew(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setEditColor(note.color ?? '');
    setEditPinned(note.pinned);
    setDeleteConfirm(false);
    setLockModalOpen(false);
    setLockPinInput('');
    setLockPinError('');
    setModalOpen(true);
  };

  const openNew = () => {
    setActiveNote(null);
    setIsNew(true);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setEditColor('');
    setEditPinned(false);
    setDeleteConfirm(false);
    setLockModalOpen(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setModalOpen(false);
    setActiveNote(null);
    setIsNew(false);
    setDeleteConfirm(false);
    setLockModalOpen(false);
    setLockPinInput('');
    setLockPinError('');
  };

  const handleCardClick = (note: Note) => {
    // If locked and not yet unlocked this session → open PIN modal
    if (note.locked && !unlockedNoteIds.has(note.id)) {
      setPinModalNote(note);
      return;
    }
    openNote(note);
  };

  const closePinModal = () => {
    setPinModalNote(null);
    setPinInput('');
    setPinError('');
    setPinEraseMessage('');
    setNoteRecoveryStep('none');
    setNoteRecoveryMethod(null);
    setNoteRecoveryMasked('');
    setNoteOtpInput('');
    setNoteNewPinInput('');
    setNoteRecoveryError('');
  };

  // ── PIN recovery ───────────────────────────────────────────────────────────

  const handleNoteRecoveryRequest = async (method: 'email' | 'sms') => {
    setNoteRecoveryLoading(true);
    setNoteRecoveryError('');
    setNoteRecoveryMethod(method);
    try {
      const res = await fetch('/api/pin-recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinType: 'notes', method }),
      });
      const data = (await res.json()) as { masked?: string; error?: string };
      if (!res.ok) {
        setNoteRecoveryError(data.error ?? 'Failed to send recovery code.');
        setNoteRecoveryMethod(null);
        return;
      }
      setNoteRecoveryMasked(data.masked ?? '');
      setNoteRecoveryStep('verify');
    } catch {
      setNoteRecoveryError('Something went wrong. Please try again.');
      setNoteRecoveryMethod(null);
    } finally {
      setNoteRecoveryLoading(false);
    }
  };

  const handleNoteRecoveryVerify = async () => {
    if (!noteOtpInput.trim() || !noteNewPinInput.trim()) return;
    setNoteRecoveryLoading(true);
    setNoteRecoveryError('');
    try {
      const res = await fetch('/api/pin-recovery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: noteOtpInput, newPin: noteNewPinInput }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setNoteRecoveryError(data.error ?? 'Invalid or expired code.');
        return;
      }
      // Success: show message then close
      setNoteRecoveryStep('none');
      setPinInput('');
      setPinError('Notes PIN reset! Enter your new PIN to unlock.');
    } catch {
      setNoteRecoveryError('Something went wrong. Please try again.');
    } finally {
      setNoteRecoveryLoading(false);
    }
  };

  // ── PIN unlock ─────────────────────────────────────────────────────────────

  const handlePinUnlock = async () => {
    if (!pinModalNote || !pinInput.trim()) return;
    setPinSubmitting(true);
    setPinError('');
    try {
      const res = await fetch(`/api/notes/${pinModalNote.id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = (await res.json()) as { success: boolean; attemptsLeft?: number; deleted?: boolean };

      if (data.deleted) {
        // Note erased
        setNotes((prev) => prev.filter((n) => n.id !== pinModalNote.id));
        setPinEraseMessage('Note erased after too many failed attempts.');
        setPinInput('');
        return;
      }

      if (data.success) {
        // Mark as session-unlocked, then open editor
        setUnlockedNoteIds((prev) => new Set([...prev, pinModalNote.id]));
        const noteToOpen = pinModalNote;
        closePinModal();
        openNote(noteToOpen);
      } else {
        const left = data.attemptsLeft ?? 0;
        setPinError(`Wrong PIN — ${left} attempt${left === 1 ? '' : 's'} left.`);
        setPinInput('');
        pinInputRef.current?.focus();
      }
    } catch {
      setPinError('Something went wrong. Please try again.');
    } finally {
      setPinSubmitting(false);
    }
  };

  // ── Lock note from editor ──────────────────────────────────────────────────

  const handleLockNote = async () => {
    if (!activeNote || !lockPinInput.trim()) return;
    setLockSubmitting(true);
    setLockPinError('');
    try {
      const res = await fetch(`/api/notes/${activeNote.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: lockPinInput }),
      });
      const data = (await res.json()) as { success: boolean; note?: Note; attemptsLeft?: number };

      if (data.success && data.note) {
        // Update note in list to locked: true
        setNotes((prev) => prev.map((n) => (n.id === activeNote.id ? data.note! : n)));
        // Remove from session-unlocked set (it's now locked again)
        setUnlockedNoteIds((prev) => {
          const next = new Set(prev);
          next.delete(activeNote.id);
          return next;
        });
        closeModal();
      } else {
        const left = data.attemptsLeft ?? 0;
        setLockPinError(
          data.attemptsLeft !== undefined
            ? `Wrong PIN — ${left} attempt${left === 1 ? '' : 's'} left.`
            : 'Wrong PIN. Please try again.'
        );
        setLockPinInput('');
        lockPinInputRef.current?.focus();
      }
    } catch {
      setLockPinError('Something went wrong. Please try again.');
    } finally {
      setLockSubmitting(false);
    }
  };

  // ── API calls ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
          tags,
          pinned: editPinned,
          color: editColor || undefined,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { note: Note };
        setNotes((prev) => [data.note, ...prev]);
        // Transition to edit mode on the newly created note
        setActiveNote(data.note);
        setIsNew(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const autoSave = useCallback(
    (id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'color' | 'pinned'>>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const res = await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const data = (await res.json()) as { note: Note };
          setNotes((prev) => prev.map((n) => (n.id === id ? data.note : n)));
          setActiveNote(data.note);
        }
      }, 500);
    },
    []
  );

  const handleTitleChange = (val: string) => {
    setEditTitle(val);
    if (activeNote && !isNew) autoSave(activeNote.id, { title: val || 'Untitled' });
  };

  const handleContentChange = (val: string) => {
    setEditContent(val);
    if (activeNote && !isNew) autoSave(activeNote.id, { content: val });
  };

  const handleTagsBlur = () => {
    if (!activeNote || isNew) return;
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    autoSave(activeNote.id, { tags });
  };

  const handleColorChange = (val: string) => {
    setEditColor(val);
    if (activeNote && !isNew) autoSave(activeNote.id, { color: val || null });
  };

  const handlePinToggle = () => {
    const next = !editPinned;
    setEditPinned(next);
    if (activeNote && !isNew) autoSave(activeNote.id, { pinned: next });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      closeModal();
    }
  };

  // ── Card rendering ─────────────────────────────────────────────────────────

  const NoteCard = ({ note }: { note: Note }) => {
    const cfg = getColorConfig(note.color);
    const isLocked = note.locked && !unlockedNoteIds.has(note.id);

    return (
      <div
        onClick={() => handleCardClick(note)}
        className={[
          'rounded-2xl border p-4 mb-4 break-inside-avoid cursor-pointer',
          'transition-all duration-200 hover:scale-[1.015] hover:shadow-lg hover:shadow-black/30',
          cfg.bg,
          cfg.border,
          'hover:border-white/[0.14]',
          isLocked ? 'relative overflow-hidden' : '',
        ].join(' ')}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 flex-1 min-w-0">
            {note.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {note.pinned && (
              <PinIcon className="h-3 w-3 text-amber-400" />
            )}
            {isLocked && (
              <LockIcon className="h-3.5 w-3.5 text-rose-400/80" />
            )}
            {note.color && !isLocked && (
              <span className={['h-2 w-2 rounded-full shrink-0', cfg.dot].join(' ')} />
            )}
          </div>
        </div>

        {/* Locked state: show overlay instead of content */}
        {isLocked ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <LockIcon className="h-5 w-5 text-rose-400" />
            </div>
            <span className="text-xs font-medium text-rose-400/70">Locked</span>
            <span className="text-[10px] text-zinc-600">Tap to unlock with PIN</span>
          </div>
        ) : (
          <>
            {/* Content preview */}
            {note.content && (
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-6 whitespace-pre-wrap mb-3">
                {note.content}
              </p>
            )}

            {/* Bottom row */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-1">
              <div className="flex flex-wrap gap-1 min-w-0">
                {note.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400 leading-none"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="text-[10px] text-zinc-600">+{note.tags.length - 3}</span>
                )}
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(note.updatedAt)}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Modal overlay ──────────────────────────────────────────────────────────

  const modalCfg = getColorConfig(editColor || null);
  const tagChips = editTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Is the currently open note locked (and session-unlocked)?
  const editorNoteIsSessionUnlocked = activeNote?.locked && unlockedNoteIds.has(activeNote.id);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full px-6 py-6">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Notes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-52 rounded-xl bg-white/[0.04] border border-white/[0.06] pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all"
            />
          </div>
          {/* New Note */}
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors shadow-lg shadow-indigo-900/30"
          >
            <span className="text-base leading-none">+</span>
            New Note
          </button>
        </div>
      </div>

      {/* ── Tag filter chips ── */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          <button
            onClick={() => setSelectedTag('')}
            className={[
              'rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
              selectedTag === ''
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/[0.04] text-zinc-400 border border-transparent hover:text-zinc-200',
            ].join(' ')}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={[
                'rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                selectedTag === tag
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/[0.04] text-zinc-400 border border-transparent hover:text-zinc-200',
              ].join(' ')}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* ── Masonry grid / states ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.06] border-t-indigo-500" />
        </div>
      ) : notes.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <DocumentIcon className="h-10 w-10 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">
            {search || selectedTag ? 'No notes match' : 'No notes yet'}
          </h3>
          <p className="text-sm text-zinc-600 mb-6">
            {search || selectedTag
              ? 'Try adjusting your search or filter.'
              : 'Capture thoughts, ideas, and anything you want to remember.'}
          </p>
          {!search && !selectedTag && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors shadow-lg shadow-indigo-900/30"
            >
              <span className="text-base leading-none">+</span>
              Create your first note
            </button>
          )}
        </div>
      ) : (
        /* Masonry grid */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {/* Pinned first */}
          {[...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* ── PIN Unlock Modal ── */}
      {pinModalNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closePinModal(); }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111114] shadow-2xl shadow-black/70 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePinModal}
              className="absolute top-4 right-4 flex items-center justify-center h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            >
              <XIcon className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4 mx-auto">
              <LockIcon className="h-6 w-6 text-rose-400" />
            </div>

            {/* Title */}
            <h2 className="text-base font-semibold text-zinc-100 text-center mb-0.5">Unlock note</h2>
            <p className="text-xs text-zinc-500 text-center mb-5 line-clamp-1 px-4">
              {pinModalNote.title || 'Untitled'}
            </p>

            {pinEraseMessage ? (
              <div className="text-center">
                <p className="text-sm text-red-400 font-medium mb-4">{pinEraseMessage}</p>
                <button
                  onClick={closePinModal}
                  className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] px-5 py-2 text-sm text-zinc-300 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : noteRecoveryStep === 'choose' ? (
              /* Recovery step 1: choose method */
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 text-center">How would you like to receive your recovery code?</p>
                {noteRecoveryError && (
                  <p className="text-xs text-red-400 text-center">{noteRecoveryError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => void handleNoteRecoveryRequest('email')}
                    disabled={noteRecoveryLoading}
                    className="flex-1 flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-indigo-500/40 px-4 py-3 text-sm text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-xl">📧</span>
                    <span className="font-medium text-xs">Email</span>
                  </button>
                  <button
                    onClick={() => void handleNoteRecoveryRequest('sms')}
                    disabled={noteRecoveryLoading}
                    className="flex-1 flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-indigo-500/40 px-4 py-3 text-sm text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-xl">📱</span>
                    <span className="font-medium text-xs">SMS</span>
                  </button>
                </div>
                <button
                  onClick={() => { setNoteRecoveryStep('none'); setNoteRecoveryError(''); }}
                  className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : noteRecoveryStep === 'verify' ? (
              /* Recovery step 2: enter OTP + new PIN */
              <div className="space-y-3">
                {noteRecoveryMasked && (
                  <p className="text-xs text-zinc-400 text-center">Code sent to <span className="text-zinc-200 font-medium">{noteRecoveryMasked}</span></p>
                )}
                {noteRecoveryError && (
                  <p className="text-xs text-red-400 text-center">{noteRecoveryError}</p>
                )}
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={noteOtpInput}
                    onChange={(e) => { setNoteOtpInput(e.target.value.replace(/\D/g, '')); setNoteRecoveryError(''); }}
                    placeholder="000000"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/50 px-4 py-3 text-center text-lg tracking-[0.25em] font-mono text-zinc-100 placeholder-zinc-700 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">New PIN (4–6 digits)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={noteNewPinInput}
                    onChange={(e) => { setNoteNewPinInput(e.target.value.replace(/\D/g, '')); setNoteRecoveryError(''); }}
                    placeholder="••••"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/50 px-4 py-3 text-center text-lg tracking-[0.25em] font-mono text-zinc-100 placeholder-zinc-700 outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={() => void handleNoteRecoveryVerify()}
                  disabled={noteRecoveryLoading || noteOtpInput.length !== 6 || noteNewPinInput.length < 4}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors shadow-lg shadow-indigo-900/30"
                >
                  {noteRecoveryLoading ? 'Verifying…' : 'Reset PIN'}
                </button>
                <button
                  onClick={() => { setNoteRecoveryStep('choose'); setNoteRecoveryError(''); setNoteOtpInput(''); setNoteNewPinInput(''); }}
                  className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Back
                </button>
              </div>
            ) : (
              <>
                {/* PIN input */}
                <input
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handlePinUnlock(); }}
                  placeholder="••••••"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-rose-500/50 px-4 py-3 text-center text-2xl tracking-[0.35em] font-mono text-zinc-100 placeholder-zinc-700 outline-none transition-colors mb-3"
                />

                {pinError && (
                  <p className="text-xs text-red-400 text-center mb-3">{pinError}</p>
                )}

                <button
                  onClick={() => void handlePinUnlock()}
                  disabled={pinSubmitting || !pinInput.trim()}
                  className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors shadow-lg shadow-rose-900/30"
                >
                  {pinSubmitting ? 'Unlocking…' : 'Unlock'}
                </button>

                {/* Forgot PIN link */}
                <button
                  onClick={() => { setNoteRecoveryStep('choose'); setNoteRecoveryError(''); }}
                  className="w-full mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Forgot PIN?
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Full-screen editor modal overlay ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className={[
              'relative w-full max-w-2xl rounded-2xl border shadow-2xl shadow-black/60 flex flex-col',
              'max-h-[90vh] overflow-hidden',
              modalCfg.bg,
              modalCfg.border,
            ].join(' ')}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-white/[0.06]">
              {/* Color picker dots */}
              <div className="flex items-center gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleColorChange(c.value)}
                    title={c.label}
                    className={[
                      'h-4 w-4 rounded-full border-2 transition-all hover:scale-110',
                      c.dot,
                      editColor === c.value
                        ? 'border-white scale-125 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100',
                    ].join(' ')}
                  />
                ))}
              </div>

              <div className="ml-auto flex items-center gap-1">
                {/* Auto-save indicator */}
                {activeNote && !isNew && (
                  <span className="text-xs text-zinc-600 mr-2">
                    {saving ? 'Saving…' : 'Auto-saved'}
                  </span>
                )}

                {/* Lock button — only for existing unlocked notes */}
                {activeNote && !isNew && !activeNote.locked && (
                  <button
                    onClick={() => setLockModalOpen(true)}
                    title="Lock this note with your journal PIN"
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LockIcon className="h-3.5 w-3.5" />
                    Lock
                  </button>
                )}

                {/* Locked + session-unlocked indicator */}
                {editorNoteIsSessionUnlocked && (
                  <span className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400/70 bg-rose-500/8 border border-rose-500/15">
                    <LockIcon className="h-3 w-3" />
                    Unlocked
                  </span>
                )}

                {/* Pin toggle */}
                <button
                  onClick={handlePinToggle}
                  title={editPinned ? 'Unpin' : 'Pin'}
                  className={[
                    'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    editPinned
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]',
                  ].join(' ')}
                >
                  <PinIcon className="h-3 w-3" />
                  {editPinned ? 'Pinned' : 'Pin'}
                </button>

                {/* Delete */}
                {activeNote && !isNew && (
                  <button
                    onClick={() => {
                      if (deleteConfirm) void handleDelete(activeNote.id);
                      else setDeleteConfirm(true);
                    }}
                    title={deleteConfirm ? 'Click again to confirm delete' : 'Delete note'}
                    className={[
                      'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ml-1',
                      deleteConfirm
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10',
                    ].join(' ')}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    {deleteConfirm ? 'Confirm' : ''}
                  </button>
                )}

                {/* Close */}
                <button
                  onClick={closeModal}
                  className="flex items-center justify-center h-7 w-7 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors ml-1"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Inline Lock PIN prompt (inside modal) */}
            {lockModalOpen && (
              <div className="mx-5 mt-4 rounded-xl border border-rose-500/20 bg-rose-950/20 p-4">
                <p className="text-xs font-medium text-rose-300 mb-3 flex items-center gap-1.5">
                  <LockIcon className="h-3.5 w-3.5" />
                  Enter your PIN to lock this note
                </p>
                <div className="flex items-center gap-2">
                  <input
                    ref={lockPinInputRef}
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={lockPinInput}
                    onChange={(e) => { setLockPinInput(e.target.value.replace(/\D/g, '')); setLockPinError(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleLockNote();
                      if (e.key === 'Escape') { setLockModalOpen(false); setLockPinInput(''); setLockPinError(''); }
                    }}
                    placeholder="Your PIN"
                    className="flex-1 rounded-lg bg-black/30 border border-rose-500/20 focus:border-rose-500/50 px-3 py-2 text-sm font-mono tracking-widest text-zinc-100 placeholder-zinc-700 outline-none transition-colors"
                  />
                  <button
                    onClick={() => void handleLockNote()}
                    disabled={lockSubmitting || !lockPinInput.trim()}
                    className="rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-xs font-medium text-white transition-colors whitespace-nowrap"
                  >
                    {lockSubmitting ? 'Locking…' : 'Lock note'}
                  </button>
                  <button
                    onClick={() => { setLockModalOpen(false); setLockPinInput(''); setLockPinError(''); }}
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors shrink-0"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                {lockPinError && (
                  <p className="text-xs text-red-400 mt-2">{lockPinError}</p>
                )}
              </div>
            )}

            {/* Title */}
            <div className="px-5 pt-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title…"
                autoFocus
                className="w-full bg-transparent text-xl font-semibold text-zinc-100 placeholder-zinc-600 outline-none"
              />
            </div>

            {/* Tags input + chips */}
            <div className="px-5 pt-2 pb-1">
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                onBlur={handleTagsBlur}
                placeholder="Add tags, comma separated…"
                className="w-full bg-transparent text-xs text-zinc-500 placeholder-zinc-700 outline-none"
              />
              {tagChips.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tagChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-md bg-white/[0.06] border border-white/[0.06] px-2 py-0.5 text-[11px] text-zinc-400"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-white/[0.06] my-2" />

            {/* Content textarea */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => { handleContentChange(e.target.value); }}
                placeholder="Start writing…"
                rows={10}
                className="w-full resize-none bg-transparent text-sm text-zinc-300 placeholder-zinc-700 outline-none leading-relaxed min-h-48"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-white/[0.06]">
              {activeNote && !isNew ? (
                <p className="text-xs text-zinc-600">
                  Created {new Date(activeNote.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
                >
                  {isNew ? 'Cancel' : 'Close'}
                </button>
                {isNew && (
                  <button
                    onClick={() => void handleCreate()}
                    disabled={saving || !editTitle.trim()}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-5 py-2 text-sm font-medium text-white transition-colors shadow-lg shadow-indigo-900/30"
                  >
                    {saving ? 'Creating…' : 'Create Note'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
