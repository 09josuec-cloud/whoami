'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useState, useEffect, useCallback, useRef } from 'react';
import PinSetupModal from './PinSetupModal';
import PinUnlockModal from './PinUnlockModal';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export interface EntryData {
  id?: string;
  title?: string;
  content: string;
  mood?: number | null;
  tags: string[];
  locked: boolean;
  entryDate: string;
}

interface EntryEditorProps {
  entry: EntryData | null;
  onSave: (data: Partial<EntryData>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onEntryDeleted?: () => void;
  saving?: boolean;
}

export default function EntryEditor({ entry, onSave, onDelete, onEntryDeleted, saving }: EntryEditorProps) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [locked, setLocked] = useState(entry?.locked ?? false);
  // revealed = PIN entered this session; resets to false when navigating to a locked entry
  const [revealed, setRevealed] = useState(!(entry?.locked ?? false));
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealedRef = useRef(revealed);
  useEffect(() => { revealedRef.current = revealed; }, [revealed]);
  const isNew = !entry?.id;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write anything…' }),
      CharacterCount,
    ],
    content: entry?.content ?? '',
    editable: !locked,
    onUpdate: ({ editor: e }) => {
      if (locked && !revealedRef.current) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        void onSave({ content: e.getHTML(), title, mood, tags });
      }, 500);
    },
  });

  // Sync state when switching entries — reset revealed for locked entries
  useEffect(() => {
    if (!editor) return;
    const isLocked = entry?.locked ?? false;
    const newContent = entry?.content ?? '';
    if (editor.getHTML() !== newContent) {
      editor.commands.setContent(newContent);
    }
    setTitle(entry?.title ?? '');
    setMood(entry?.mood ?? null);
    setTags(entry?.tags ?? []);
    setLocked(isLocked);
    setRevealed(!isLocked); // locked entries always start hidden
    editor.setEditable(!isLocked);
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    editor?.setEditable(!locked || revealed);
  }, [locked, revealed, editor]);

  const handleSaveNow = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    void onSave({ content: editor?.getHTML() ?? '', title, mood, tags });
  }, [editor, title, mood, tags, onSave]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        void onSave({ tags: newTags });
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      void onSave({ tags: newTags });
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    void onSave({ tags: newTags });
  };

  const handleLockClick = useCallback(async () => {
    if (locked) {
      // Already locked — hide content again (re-lock view)
      setRevealed(false);
    } else {
      // Locking an unlocked entry
      const res = await fetch('/api/journal/pin');
      const data = (await res.json()) as { hasPin?: boolean };
      if (!data.hasPin) {
        setShowPinSetup(true);
      } else {
        setLocked(true);
        setRevealed(false);
        void onSave({ locked: true });
      }
    }
  }, [locked, onSave]);

  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  if (!entry && isNew) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
        Select an entry or create a new one
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {showPinSetup && (
        <PinSetupModal
          onSuccess={() => {
            setShowPinSetup(false);
            setLocked(true);
            setRevealed(false);
            void onSave({ locked: true });
          }}
          onCancel={() => setShowPinSetup(false)}
        />
      )}
      {showPinUnlock && entry?.id && (
        <PinUnlockModal
          entryId={entry.id}
          onSuccess={(fullEntry) => {
            setShowPinUnlock(false);
            setRevealed(true);
            // Load the real content into the editor
            setTitle(fullEntry.title ?? '');
            setMood(fullEntry.mood ?? null);
            setTags(fullEntry.tags);
            editor?.commands.setContent(fullEntry.content);
          }}
          onDeleted={() => {
            setShowPinUnlock(false);
            onEntryDeleted?.();
          }}
          onCancel={() => setShowPinUnlock(false)}
        />
      )}

      {/* Locked screen — shown when entry is locked and not yet revealed this session */}
      {locked && !revealed ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
          <div className="text-6xl select-none">🔒</div>
          <div className="text-center">
            {title && <p className="text-lg font-semibold text-zinc-200 mb-1">{title}</p>}
            <p className="text-base font-medium text-zinc-400">This entry is locked</p>
            <p className="text-xs text-zinc-600 mt-1">Enter your PIN to view it</p>
          </div>
          <button
            onClick={() => setShowPinUnlock(true)}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Enter PIN
          </button>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3 gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {saving ? (
                <span className="text-indigo-400">Saving…</span>
              ) : (
                <span>{wordCount} words · {charCount} chars</span>
              )}
              {locked && revealed && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400 text-[10px] font-medium">
                  🔒 Viewing locked entry
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={locked && !revealed}
                className={['px-2 py-1 rounded text-xs font-bold transition-colors', editor?.isActive('bold') ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'].join(' ')}
              >B</button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={locked && !revealed}
                className={['px-2 py-1 rounded text-xs italic transition-colors', editor?.isActive('italic') ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'].join(' ')}
              >I</button>
              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={locked && !revealed}
                className={['px-2 py-1 rounded text-xs transition-colors', editor?.isActive('bulletList') ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'].join(' ')}
              >• List</button>
              <div className="w-px h-4 bg-zinc-800" />
              <button
                onClick={() => void handleLockClick()}
                className={['px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1', locked ? 'bg-amber-600/20 text-amber-400' : 'text-zinc-400 hover:bg-zinc-800'].join(' ')}
                title={locked ? 'Hide entry' : 'Lock entry'}
              >
                {locked ? '🔒 Hide' : '🔓 Lock'}
              </button>
              <button
                onClick={handleSaveNow}
                disabled={(locked && !revealed) || saving}
                className="px-3 py-1 rounded text-xs bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
              {onDelete && (
                <button
                  onClick={() => void onDelete()}
                  className="px-2 py-1 rounded text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="px-6 pt-5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void onSave({ title, mood, tags })}
              disabled={locked && !revealed}
              placeholder="Title (optional)"
              className="w-full bg-transparent text-2xl font-semibold text-zinc-100 placeholder-zinc-700 outline-none disabled:opacity-50"
            />
          </div>

          {/* Mood picker */}
          <div className="flex items-center gap-1.5 px-6 pt-3">
            <span className="text-xs text-zinc-600 mr-1">Mood</span>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  const newMood = mood === m.value ? null : m.value;
                  setMood(newMood);
                  void onSave({ mood: newMood });
                }}
                disabled={locked && !revealed}
                title={m.label}
                className={['text-lg leading-none rounded-full p-1 transition-all', mood === m.value ? 'bg-indigo-600/30 scale-110' : 'opacity-40 hover:opacity-100'].join(' ')}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <EditorContent
              editor={editor}
              className="prose prose-invert prose-sm max-w-none min-h-[200px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]"
            />
          </div>

          {/* Tags */}
          <div className="border-t border-zinc-800 px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-600">Tags</span>
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
                  {tag}
                  {(!locked || revealed) && (
                    <button onClick={() => removeTag(tag)} className="hover:text-white leading-none">×</button>
                  )}
                </span>
              ))}
              {(!locked || revealed) && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag…"
                  className="bg-transparent text-xs text-zinc-300 placeholder-zinc-700 outline-none w-20"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
