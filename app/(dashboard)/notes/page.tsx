'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS: { label: string; value: string; bg: string; border: string }[] = [
  { label: 'Default', value: '', bg: 'bg-zinc-900', border: 'border-zinc-800' },
  { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-950/40', border: 'border-indigo-800/40' },
  { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40' },
  { label: 'Amber', value: 'amber', bg: 'bg-amber-950/40', border: 'border-amber-800/40' },
  { label: 'Rose', value: 'rose', bg: 'bg-rose-950/40', border: 'border-rose-800/40' },
  { label: 'Purple', value: 'purple', bg: 'bg-purple-950/40', border: 'border-purple-800/40' },
];

const COLOR_DOT: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  purple: 'bg-purple-500',
};

function getNoteBg(color: string | null) {
  const c = NOTE_COLORS.find((n) => n.value === (color ?? ''));
  return c ? `${c.bg} ${c.border}` : 'bg-zinc-900 border-zinc-800';
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

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchNotes(search, selectedTag);
    }, 300);
    return () => clearTimeout(t);
  }, [search, selectedTag, fetchNotes]);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  const openNote = (note: Note) => {
    setActiveNote(note);
    setShowNew(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setEditColor(note.color ?? '');
    setEditPinned(note.pinned);
  };

  const openNew = () => {
    setActiveNote(null);
    setShowNew(true);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setEditColor('');
    setEditPinned(false);
  };

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
        setShowNew(false);
        openNote(data.note);
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
      }, 800);
    },
    []
  );

  const handleTitleChange = (val: string) => {
    setEditTitle(val);
    if (activeNote) autoSave(activeNote.id, { title: val || 'Untitled' });
  };

  const handleContentChange = (val: string) => {
    setEditContent(val);
    if (activeNote) autoSave(activeNote.id, { content: val });
  };

  const handleTagsBlur = () => {
    if (!activeNote) return;
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    autoSave(activeNote.id, { tags });
  };

  const handleColorChange = (val: string) => {
    setEditColor(val);
    if (activeNote) autoSave(activeNote.id, { color: val || null });
  };

  const handlePinToggle = () => {
    const next = !editPinned;
    setEditPinned(next);
    if (activeNote) autoSave(activeNote.id, { pinned: next });
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNote?.id === id) {
        setActiveNote(null);
        setShowNew(false);
      }
    }
  };

  const isEditing = showNew || activeNote !== null;
  const editorBg = getNoteBg(editColor || null);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h1 className="text-sm font-semibold text-zinc-100">Notes</h1>
          <button
            onClick={openNew}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-lg leading-none"
            title="New note"
          >
            +
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-zinc-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-zinc-800">
            <button
              onClick={() => setSelectedTag('')}
              className={[
                'rounded-full px-2 py-0.5 text-[10px] transition-colors',
                selectedTag === '' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
              ].join(' ')}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={[
                  'rounded-full px-2 py-0.5 text-[10px] transition-colors',
                  selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                ].join(' ')}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
            </div>
          ) : notes.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-zinc-500">
                {search || selectedTag ? 'No notes match.' : 'No notes yet.'}
              </p>
              {!search && !selectedTag && (
                <button onClick={openNew} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                  + Create your first note
                </button>
              )}
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                className={[
                  'group w-full border-b border-zinc-800/60 px-4 py-3 text-left transition-colors hover:bg-zinc-800/40',
                  activeNote?.id === note.id ? 'bg-zinc-800/60' : '',
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  {note.color && (
                    <span className={['mt-1 h-2 w-2 shrink-0 rounded-full', COLOR_DOT[note.color] ?? 'bg-zinc-500'].join(' ')} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      {note.pinned && <span className="text-[10px] text-amber-400">📌</span>}
                      <p className="truncate text-xs font-medium text-zinc-200">{note.title}</p>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">
                      {note.content || 'Empty note'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] text-zinc-600">{timeAgo(note.updatedAt)}</span>
                      {note.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded bg-zinc-800 px-1 py-px text-[9px] text-zinc-500">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Note count */}
        <div className="border-t border-zinc-800 px-4 py-2">
          <p className="text-[10px] text-zinc-600">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
        </div>
      </div>

      {/* Editor pane */}
      {isEditing ? (
        <div className={['flex flex-1 flex-col overflow-hidden border-l border-zinc-800', editorBg].join(' ')}>
          {/* Editor toolbar */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
            <div className="flex items-center gap-2">
              {/* Color picker */}
              <div className="flex items-center gap-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleColorChange(c.value)}
                    title={c.label}
                    className={[
                      'h-4 w-4 rounded-full border-2 transition-transform hover:scale-110',
                      c.value === '' ? 'bg-zinc-700' : COLOR_DOT[c.value] ?? 'bg-zinc-500',
                      editColor === c.value ? 'border-white scale-110' : 'border-transparent',
                    ].join(' ')}
                  />
                ))}
              </div>

              {/* Pin toggle */}
              <button
                onClick={handlePinToggle}
                className={['rounded px-2 py-0.5 text-[10px] transition-colors', editPinned ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'].join(' ')}
                title={editPinned ? 'Unpin' : 'Pin'}
              >
                📌 {editPinned ? 'Pinned' : 'Pin'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeNote && (
                <span className="text-[10px] text-zinc-600">
                  {saving ? 'Saving…' : 'Auto-saved'}
                </span>
              )}
              {activeNote && (
                <button
                  onClick={() => void handleDelete(activeNote.id)}
                  className="rounded-md p-1 text-zinc-600 hover:text-red-400 transition-colors"
                  title="Delete note"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => { setActiveNote(null); setShowNew(false); }}
                className="rounded-md p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={editTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Note title…"
            className="border-b border-zinc-800 bg-transparent px-6 py-4 text-lg font-semibold text-zinc-100 placeholder-zinc-600 outline-none"
          />

          {/* Tags */}
          <div className="border-b border-zinc-800 px-6 py-2">
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              onBlur={handleTagsBlur}
              placeholder="Tags (comma separated)…"
              className="w-full bg-transparent text-xs text-zinc-400 placeholder-zinc-600 outline-none"
            />
          </div>

          {/* Content */}
          <textarea
            value={editContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing…"
            className="flex-1 resize-none bg-transparent px-6 py-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none leading-relaxed"
          />

          {/* New note action bar */}
          {showNew && (
            <div className="border-t border-zinc-800 px-4 py-3 flex justify-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={saving || !editTitle.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating…' : 'Create Note'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-3xl">
              📝
            </div>
            <p className="text-sm font-medium text-zinc-400">Select a note or create a new one</p>
            <button
              onClick={openNew}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + New Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
