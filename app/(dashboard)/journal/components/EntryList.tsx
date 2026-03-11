'use client';

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

interface EntryListProps {
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EntryList({ entries, selectedId, onSelect }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-zinc-500 text-sm px-4 text-center">
        No entries yet. Click <strong className="text-zinc-300 mx-1">New Entry</strong> to start writing.
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800/60">
      {entries.map((entry) => {
        const isSelected = entry.id === selectedId;
        const preview = stripHtml(entry.content).slice(0, 100);
        const displayTitle = entry.title?.trim() || 'Untitled';

        return (
          <button
            key={entry.id}
            onClick={() => onSelect(entry.id)}
            className={[
              'w-full text-left px-4 py-3.5 transition-colors',
              isSelected ? 'bg-indigo-600/10 border-r-2 border-indigo-500' : 'hover:bg-zinc-800/40',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className={['text-sm font-medium truncate', isSelected ? 'text-indigo-300' : 'text-zinc-200'].join(' ')}>
                {entry.locked && <span className="mr-1 text-amber-500">🔒</span>}
                {displayTitle}
              </span>
              {entry.mood && (
                <span className="text-sm shrink-0">{MOOD_EMOJI[entry.mood]}</span>
              )}
            </div>
            {entry.locked ? (
              <p className="text-xs text-amber-500/50 italic mb-1.5">Protected content</p>
            ) : (
              <p className="text-xs text-zinc-500 line-clamp-2 mb-1.5">{preview || 'No content'}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">{formatDate(entry.entryDate)}</span>
              {!entry.locked && entry.tags.length > 0 && (
                <div className="flex gap-1">
                  {entry.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] text-indigo-400 bg-indigo-600/10 px-1.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {entry.tags.length > 2 && (
                    <span className="text-[10px] text-zinc-500">+{entry.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
