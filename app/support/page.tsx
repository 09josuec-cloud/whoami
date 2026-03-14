'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !issueType || !message) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, issueType, message }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please email us directly at support@whoami.company');
    }
  };

  const inputClass = "w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <span className="text-xs font-bold text-white">W</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">whoami</span>
          </Link>
          <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Title */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Help</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-3">Support</h1>
          <p className="text-sm text-zinc-500">
            We typically respond within 24–48 hours. For urgent issues, email{' '}
            <a href="mailto:support@whoami.company" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              support@whoami.company
            </a>{' '}
            directly.
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-8 py-12 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-zinc-100">Message sent!</h2>
            <p className="mb-6 text-sm text-zinc-500">We'll get back to you at <span className="text-zinc-300">{email}</span> within 24–48 hours.</p>
            <Link href="/" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 md:grid-cols-[1fr_280px]">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'error' && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
                  {errorMsg}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Issue type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="" disabled className="bg-zinc-900">Select an issue type</option>
                  <option value="bug" className="bg-zinc-900">Bug report</option>
                  <option value="account" className="bg-zinc-900">Account issue</option>
                  <option value="billing" className="bg-zinc-900">Billing question</option>
                  <option value="feature" className="bg-zinc-900">Feature request</option>
                  <option value="data" className="bg-zinc-900">Data / privacy request</option>
                  <option value="other" className="bg-zinc-900">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Message</label>
                <textarea
                  placeholder="Describe your issue in as much detail as possible..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || !name || !email || !issueType || !message}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </>
                ) : 'Send message'}
              </button>
            </form>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="mb-3 text-sm font-semibold text-zinc-100">Contact directly</h3>
                <div className="space-y-2.5 text-sm">
                  <div>
                    <p className="text-xs text-zinc-600 mb-0.5">General</p>
                    <a href="mailto:hello@whoami.company" className="text-indigo-400 hover:text-indigo-300 transition-colors">hello@whoami.company</a>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 mb-0.5">Support</p>
                    <a href="mailto:support@whoami.company" className="text-indigo-400 hover:text-indigo-300 transition-colors">support@whoami.company</a>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 mb-0.5">Privacy</p>
                    <a href="mailto:privacy@whoami.company" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@whoami.company</a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="mb-3 text-sm font-semibold text-zinc-100">Resources</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/terms" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                    <span className="h-1 w-1 rounded-full bg-zinc-600" />
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                    <span className="h-1 w-1 rounded-full bg-zinc-600" />
                    Privacy Policy
                  </Link>
                </div>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Response time is typically 24–48 hours. For data deletion or export requests, please select "Data / privacy request" and we'll handle it promptly.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} whoami.company. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/support" className="text-xs text-indigo-400">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
