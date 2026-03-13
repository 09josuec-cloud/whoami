'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "How's my budget looking this month?",
  "What's my current journal streak?",
  "Do I have any overdue reminders?",
  "How am I tracking on my savings goals?",
  "What's my mood been like lately?",
  "Summarize my financial health",
];

// ── Simple markdown renderer (bold, italic, inline code, lists) ──────────────

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    // Horizontal rule
    if (/^──/.test(line)) {
      nodes.push(<hr key={key++} className="border-white/[0.06] my-3" />);
      continue;
    }

    // List item
    if (/^(\s*)[•\-\*] /.test(line)) {
      nodes.push(
        <div key={key++} className="flex gap-2 my-0.5">
          <span className="text-zinc-500 shrink-0">•</span>
          <span>{renderInline(line.replace(/^(\s*)[•\-\*] /, ''))}</span>
        </div>
      );
      continue;
    }

    // Empty line = spacer
    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Normal paragraph
    nodes.push(<p key={key++} className="leading-relaxed">{renderInline(line)}</p>);
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode {
  // Split on bold (**...**), italic (*...*), and inline code (`...`)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-white/[0.06] px-1 py-0.5 text-xs font-mono text-indigo-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ── Icons ────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssistantClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || isStreaming) return;

    setError(null);
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Request failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.text } : m
                )
              );
            }
          } catch {
            // ignore parse errors on individual chunks
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
      setIsStreaming(false);
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <SparklesIcon />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">AI Assistant</h1>
            <p className="text-xs text-zinc-500">Knows your budget, journal, calendar, and goals</p>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors duration-150"
          >
            <TrashIcon />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="mx-auto max-w-2xl">
            {/* Welcome */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <SparklesIcon />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">What can I help you with?</h2>
              <p className="mt-1 text-sm text-zinc-500">
                I have access to your financial data, journal, calendar, reminders, and goals.
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-xl border border-white/[0.06] bg-[#111114] px-4 py-3 text-left text-sm text-zinc-400 transition-colors duration-150 hover:bg-white/[0.04] hover:text-zinc-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={['flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'].join(' ')}>
                {/* Avatar */}
                <div className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/[0.06] text-zinc-400',
                ].join(' ')}>
                  {msg.role === 'user' ? 'Y' : (
                    <SparklesIcon />
                  )}
                </div>

                {/* Bubble */}
                <div className={[
                  'max-w-[80%] rounded-xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#111114] border border-white/[0.06] text-zinc-300',
                ].join(' ')}>
                  {msg.role === 'assistant' ? (
                    <div className="space-y-0.5">
                      {msg.content ? renderMarkdown(msg.content) : null}
                      {msg.streaming && (
                        <span className="inline-block h-4 w-0.5 animate-pulse bg-indigo-400 align-middle ml-0.5" />
                      )}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.06] px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-3 rounded-xl border border-white/[0.06] bg-[#111114] px-4 py-3 focus-within:border-indigo-500/40 transition-colors duration-150">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your data…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none disabled:opacity-50 max-h-40 leading-relaxed"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
              }}
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors duration-150 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-600">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

    </div>
  );
}
