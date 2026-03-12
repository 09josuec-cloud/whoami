import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'docs');
mkdirSync(OUT_DIR, { recursive: true });

// ─── Shared styles ────────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a0a0a;
    color: #e4e4e7;
    line-height: 1.6;
    font-size: 13px;
    padding: 48px 56px;
  }
  h1 { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  h2 { font-size: 16px; font-weight: 600; color: #a1a1aa; margin-bottom: 24px; font-weight: 400; }
  h3 { font-size: 14px; font-weight: 600; color: #e4e4e7; margin-bottom: 10px; margin-top: 20px; }
  h4 { font-size: 12px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; margin-top: 16px; }
  p  { color: #a1a1aa; margin-bottom: 8px; font-size: 12.5px; }
  ul { list-style: none; padding: 0; }
  li { padding: 4px 0 4px 16px; color: #a1a1aa; font-size: 12.5px; position: relative; }
  li::before { content: '·'; position: absolute; left: 4px; color: #6366f1; }
  .badge {
    display: inline-flex; align-items: center;
    background: rgba(99,102,241,0.15); color: #818cf8;
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 500;
    margin-bottom: 20px;
  }
  .badge.green  { background: rgba(16,185,129,0.15); color: #34d399; border-color: rgba(16,185,129,0.3); }
  .badge.amber  { background: rgba(245,158,11,0.15); color: #fbbf24; border-color: rgba(245,158,11,0.3); }
  .divider { border: none; border-top: 1px solid #27272a; margin: 24px 0; }
  .section { background: #111111; border: 1px solid #27272a; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; }
  .section-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .tag { display: inline-block; background: #1c1c1e; border: 1px solid #3f3f46; border-radius: 4px; padding: 2px 8px; font-size: 11px; color: #71717a; margin: 2px 2px 2px 0; }
  .highlight { color: #818cf8; }
  .stack-pill { display: inline-block; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); border-radius: 6px; padding: 3px 10px; font-size: 11px; color: #818cf8; margin: 3px 3px 3px 0; }
  .status-complete { color: #34d399; font-size: 11px; font-weight: 600; }
  .header-bar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; }
  .logo { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .logo span { color: #6366f1; }
  .page-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
  .page-footer p { font-size: 11px; color: #52525b; margin: 0; }
  .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .feature-card { background: #0f0f0f; border: 1px solid #27272a; border-radius: 8px; padding: 14px 16px; }
  .feature-card h4 { font-size: 11.5px; font-weight: 600; color: #e4e4e7; margin: 0 0 6px 0; text-transform: none; letter-spacing: 0; }
  .feature-card p { font-size: 11px; color: #71717a; margin: 0; }
  .accent-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366f1; display: inline-block; margin-right: 6px; }
  .accent-dot.green { background: #10b981; }
  .accent-dot.amber { background: #f59e0b; }
  .api-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #1c1c1e; }
  .api-row:last-child { border-bottom: none; }
  .method { font-size: 10px; font-weight: 700; background: rgba(99,102,241,0.15); color: #818cf8; border-radius: 3px; padding: 2px 6px; min-width: 44px; text-align: center; }
  .method.get   { background: rgba(16,185,129,0.15); color: #34d399; }
  .method.post  { background: rgba(99,102,241,0.15); color: #818cf8; }
  .method.patch { background: rgba(245,158,11,0.15); color: #fbbf24; }
  .method.del   { background: rgba(239,68,68,0.15); color: #f87171; }
  .api-path { font-size: 11px; font-family: 'SF Mono', 'Fira Code', monospace; color: #a1a1aa; }
  .api-desc { font-size: 11px; color: #52525b; margin-left: auto; }
`;

function header(title, subtitle) {
  return `
    <div class="header-bar">
      <div>
        <div class="logo">who<span>a</span>mi</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#52525b;">Personal Life OS</div>
        <div style="font-size:11px;color:#3f3f46;">Confidential</div>
      </div>
    </div>
    <h1>${title}</h1>
    <h2>${subtitle}</h2>
  `;
}

function footer(pageNote) {
  return `
    <div class="page-footer">
      <p>${pageNote}</p>
      <p>whoami · Personal Life OS</p>
    </div>
  `;
}

// ─── Document definitions ──────────────────────────────────────────────────────
const docs = [
  {
    filename: 'whoami-overview.pdf',
    title: 'Project Overview',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css}</style></head><body>
      ${header('Whoami — Project Overview', 'Personal Life OS: one secure app replacing budgeting, journaling, calendar, notes, reminders, and AI.')}

      <span class="badge green">✓ Phases 1–5 Complete</span>

      <div class="section">
        <h4>What is Whoami?</h4>
        <p>Whoami is a full-stack personal operating system built as a single secure web application. It replaces fragmented tools — Mint, Day One, Google Calendar, Notion, Reminders, and AI assistants — with one unified platform that never shares data with third parties.</p>
        <p>All data lives in a private PostgreSQL database. Authentication uses Argon2id + JWT sessions. Every module is built with TypeScript strict mode, Next.js 16 App Router, and a dark-first UI with indigo/violet accents.</p>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Tech Stack</h4>
          <div>
            <span class="stack-pill">Next.js 16</span>
            <span class="stack-pill">React 19</span>
            <span class="stack-pill">TypeScript strict</span>
            <span class="stack-pill">Tailwind CSS v4</span>
            <span class="stack-pill">PostgreSQL (Neon)</span>
            <span class="stack-pill">Prisma 7</span>
            <span class="stack-pill">NextAuth v5</span>
            <span class="stack-pill">Vercel</span>
          </div>
        </div>
        <div class="section" style="margin:0">
          <h4>Security Stack</h4>
          <ul>
            <li>Argon2id password hashing</li>
            <li>JWT sessions · httpOnly cookies</li>
            <li>7 security headers via middleware</li>
            <li>Rate limiting (5 attempts / 15 min / IP)</li>
            <li>Zod validation on all inputs</li>
            <li>Audit logging to database</li>
            <li>Journal PIN with 5-attempt erase</li>
          </ul>
        </div>
      </div>

      <hr class="divider"/>

      <h3>Phase Roadmap</h3>
      <div class="section">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          ${[
            ['Phase 1', 'Foundation', 'Auth, dashboard shell, DB schema, security headers, rate limiting, audit logs', 'complete'],
            ['Phase 2', 'Budget', 'Plaid sync, transactions, 14 categories, budgets, subscriptions, savings goals, cash flow, net worth', 'complete'],
            ['Phase 3', 'Journal', 'TipTap editor, mood tracking, tags, calendar view, PIN lock (session-only, 5-attempt erase)', 'complete'],
            ['Phase 4', 'Calendar & Reminders', 'Google Calendar sync, iCal import, month/week/day views, standalone reminders page, two-way event push', 'complete'],
            ['Phase 5', 'Analytics', 'Mood chart, journal frequency, budget breakdown, savings progress, net worth card, cash flow chart', 'complete'],
            ['Phase 6', 'Notes', 'Full CRUD notes with color themes, tags, pin, auto-save, sidebar search/filter, two-pane editor', 'complete'],
            ['Phase 7', 'AI Assistant', 'Context-aware AI using Claude API — answers questions about your finances, mood, and calendar', 'upcoming'],
            ['Phase 8', 'Advanced Modules', 'Habit tracking, goal timeline, health integration, sleep logs', 'upcoming'],
          ].map(([phase, name, desc, status]) => `
            <div class="feature-card">
              <h4>
                <span class="accent-dot ${status === 'complete' ? 'green' : status === 'upcoming' ? 'amber' : ''}"></span>
                ${phase} — ${name}
              </h4>
              <p>${desc}</p>
              <span style="font-size:10px;color:${status==='complete'?'#34d399':'#f59e0b'};font-weight:600;margin-top:6px;display:block;">${status === 'complete' ? '✓ Complete' : '◦ Upcoming'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      ${footer('Phase Roadmap · March 2026')}
    </body></html>`,
  },

  {
    filename: 'whoami-phase1-foundation.pdf',
    title: 'Phase 1 — Foundation',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css}</style></head><body>
      ${header('Phase 1 — Foundation', 'Auth system, dashboard shell, security middleware, rate limiting, audit logging, database schema.')}

      <span class="badge green">✓ Complete</span>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Authentication</h4>
          <ul>
            <li>NextAuth v5 (beta) — Credentials provider</li>
            <li>Argon2id password hashing (<code>@node-rs/argon2</code>)</li>
            <li>JWT sessions with httpOnly cookies</li>
            <li>Register + Login pages</li>
            <li>Session validated via <code>/api/auth/session</code> — no SessionProvider</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Security Middleware</h4>
          <ul>
            <li>7 security headers: CSP, HSTS, X-Frame-Options, X-Content-Type, Referrer-Policy, Permissions-Policy, X-XSS-Protection</li>
            <li>Rate limiting: 5 attempts / 15 min / IP (in-memory)</li>
            <li>Route protection — all /dashboard/* require session</li>
            <li>Zod validation on all inputs</li>
          </ul>
        </div>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Database Schema</h4>
          <ul>
            <li>User, Account, Session, VerificationToken</li>
            <li>AuditLog — tracks all auth events</li>
            <li>Prisma 7 with <code>@prisma/adapter-pg</code></li>
            <li>PostgreSQL on Neon (serverless)</li>
            <li>Deploy via <code>prisma db push</code></li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Dashboard Shell</h4>
          <ul>
            <li>Sidebar navigation with active state</li>
            <li>Module framework (route-based)</li>
            <li>Notification bell with unread badge</li>
            <li>Dark theme — bg #0a0a0a, indigo/violet accents</li>
            <li>Responsive layout with overflow handling</li>
          </ul>
        </div>
      </div>

      <hr class="divider"/>
      <h3>API Routes</h3>
      <div class="section">
        ${[
          ['POST', '/api/auth/register', 'Register with email + password (Argon2id hash)'],
          ['POST', '/api/auth/login', 'Credentials sign-in, sets JWT session cookie'],
          ['GET',  '/api/auth/session', 'Return current user session data'],
          ['POST', '/api/auth/signout', 'Clear session and redirect'],
          ['GET',  '/api/notifications', 'List notifications + unread count'],
          ['PATCH','/api/notifications/[id]', 'Mark single notification read'],
          ['POST', '/api/notifications/mark-all-read', 'Mark all notifications read'],
        ].map(([m, p, d]) => `
          <div class="api-row">
            <span class="method ${m.toLowerCase()}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc">${d}</span>
          </div>
        `).join('')}
      </div>

      ${footer('Phase 1 — Foundation · Auth, Security, DB')}
    </body></html>`,
  },

  {
    filename: 'whoami-phase2-budget.pdf',
    title: 'Phase 2 — Budget',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css}</style></head><body>
      ${header('Phase 2 — Budget', 'Plaid bank sync, transaction management, budgets, subscriptions, savings goals, cash flow, net worth.')}

      <span class="badge green">✓ Complete</span>

      <div class="feature-grid">
        <div class="feature-card">
          <h4>🏦 Plaid Integration</h4>
          <p>Connect real bank accounts via Plaid Link. Sync transactions with cursor-based incremental updates. Supports checking, savings, credit, investment accounts.</p>
        </div>
        <div class="feature-card">
          <h4>💳 Transactions</h4>
          <p>Full transaction list with search, category filter, pagination (25/page). Categories: 14 built-in (Food, Shopping, Transport, Entertainment, etc.). Income/expense color coding.</p>
        </div>
        <div class="feature-card">
          <h4>📊 Budget Tracking</h4>
          <p>Set monthly budgets per category. Visual progress bars — green/amber/red states at 0/80%/100% spend. Over-budget alerts. Budget health overview on dashboard.</p>
        </div>
        <div class="feature-card">
          <h4>🔁 Subscriptions</h4>
          <p>Auto-detected recurring charges from transaction history. Shows monthly/annual cost, last charge date, merchant name. Helps identify forgotten subscriptions.</p>
        </div>
        <div class="feature-card">
          <h4>🎯 Savings Goals</h4>
          <p>Create goals with name, emoji, color, target amount, and optional due date. Track progress with ring chart. Dashboard shows top 3 goals with progress bars.</p>
        </div>
        <div class="feature-card">
          <h4>📈 Cash Flow Chart</h4>
          <p>6-month bar chart showing income vs spending side by side (Recharts). Net cash flow calculation. Drill-down to category breakdown with donut chart.</p>
        </div>
      </div>

      <hr class="divider"/>
      <h3>API Routes</h3>
      <div class="section">
        ${[
          ['POST', '/api/plaid/link-token', 'Create Plaid link token for bank connection UI'],
          ['POST', '/api/plaid/exchange-token', 'Exchange public token for access token + save'],
          ['GET',  '/api/plaid/accounts', 'List all linked bank accounts with balances'],
          ['POST', '/api/plaid/sync', 'Sync new transactions from Plaid (cursor-based)'],
          ['GET',  '/api/plaid/transactions', 'Get transactions for month/year with pagination'],
          ['GET',  '/api/budget', 'Get budgets for month/year'],
          ['POST', '/api/budget', 'Create or update budget for category'],
          ['GET',  '/api/budget/cashflow', 'Get 6-month income vs spending trend'],
          ['GET',  '/api/savings-goals', 'List all savings goals'],
          ['POST', '/api/savings-goals', 'Create new savings goal'],
          ['PATCH','/api/savings-goals/[id]', 'Update goal amount or details'],
          ['DEL',  '/api/savings-goals/[id]', 'Delete savings goal'],
        ].map(([m, p, d]) => `
          <div class="api-row">
            <span class="method ${m.toLowerCase()}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc">${d}</span>
          </div>
        `).join('')}
      </div>

      <hr class="divider"/>
      <h3>14 Transaction Categories</h3>
      <div class="section">
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${['🍽️ Food & Dining','🛍️ Shopping','🚗 Transportation','🎬 Entertainment','📱 Subscriptions','⚡ Bills & Utilities','💊 Healthcare','💆 Personal Care','✈️ Travel','📚 Education','🏡 Home & Garden','💰 Income','↔️ Transfer','📦 Other'].map(c => `<span class="tag">${c}</span>`).join('')}
        </div>
      </div>

      ${footer('Phase 2 — Budget · Plaid, Transactions, Goals')}
    </body></html>`,
  },

  {
    filename: 'whoami-phase3-journal.pdf',
    title: 'Phase 3 — Journal',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css}</style></head><body>
      ${header('Phase 3 — Journal', 'TipTap rich text editor, mood tracking (1–5), tags, calendar view, PIN lock with session-only unlock.')}

      <span class="badge green">✓ Complete</span>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Rich Text Editor (TipTap)</h4>
          <ul>
            <li>StarterKit: bold, italic, headings, lists, blockquote, code</li>
            <li>Placeholder extension — "Write anything…"</li>
            <li>Character count display</li>
            <li>Auto-save on keystroke (500ms debounce)</li>
            <li>Dynamic import (no SSR) to avoid hydration issues</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Mood Tracking</h4>
          <ul>
            <li>5-point scale: 😞 Rough → 😄 Great</li>
            <li>Visual emoji picker in editor toolbar</li>
            <li>Average mood shown in analytics</li>
            <li>Mood-colored dots on journal calendar</li>
            <li>Month filter: entries + mood shown together</li>
          </ul>
        </div>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>PIN Lock</h4>
          <ul>
            <li>Argon2id hashed PIN stored in User table</li>
            <li>Lock/unlock per entry (not global)</li>
            <li>Session-only: <code>revealed</code> state (not persisted)</li>
            <li>5 failed attempts → entry content erased permanently</li>
            <li>Locked entries show blurred placeholder until unlocked</li>
            <li>PIN change/remove flow in Settings → Journal tab</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Organization</h4>
          <ul>
            <li>Tags: comma-separated, filterable sidebar chips</li>
            <li>Full-text search across title + content</li>
            <li>Month/year navigation</li>
            <li>Calendar view: mood-colored day dots</li>
            <li>List view: sorted by most recent</li>
            <li>Entry date separate from created/updated timestamps</li>
          </ul>
        </div>
      </div>

      <hr class="divider"/>
      <h3>API Routes</h3>
      <div class="section">
        ${[
          ['GET',   '/api/journal', 'List entries for month/year with search + tag filter'],
          ['POST',  '/api/journal', 'Create new journal entry (blank draft)'],
          ['GET',   '/api/journal/[id]', 'Get single entry (checks PIN lock state)'],
          ['PATCH', '/api/journal/[id]', 'Auto-save: title, content, mood, tags, locked'],
          ['DEL',   '/api/journal/[id]', 'Delete entry permanently'],
          ['GET',   '/api/journal/calendar', 'Get dates + moods for calendar month view'],
          ['GET',   '/api/journal/tags', 'Get all unique tags for current user'],
          ['POST',  '/api/journal/pin', 'Set or remove journal PIN (Argon2id)'],
          ['POST',  '/api/journal/[id]/unlock', 'Verify PIN and mark entry revealed (session only)'],
        ].map(([m, p, d]) => `
          <div class="api-row">
            <span class="method ${m.toLowerCase().replace('del','del')}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc">${d}</span>
          </div>
        `).join('')}
      </div>

      ${footer('Phase 3 — Journal · TipTap, Mood, PIN Lock')}
    </body></html>`,
  },

  {
    filename: 'whoami-phase4-calendar.pdf',
    title: 'Phase 4 — Calendar & Reminders',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css}</style></head><body>
      ${header('Phase 4 — Calendar & Reminders', 'Google Calendar two-way sync, iCal import, month/week/day views, standalone reminders with repeat support.')}

      <span class="badge green">✓ Complete</span>

      <div class="feature-grid">
        <div class="feature-card">
          <h4>📅 Month View</h4>
          <p>6-row × 7-col grid. Event color pills (up to 3 per day). "+N more" opens DayEventsModal. Clicking day number navigates to Day view. Overflow from prev/next month shown dimmed.</p>
        </div>
        <div class="feature-card">
          <h4>📆 Week View</h4>
          <p>Full time-grid with 56px hourly rows, absolute-positioned event blocks, sticky day headers, current time red line indicator. Clickable day numbers go to Day view.</p>
        </div>
        <div class="feature-card">
          <h4>🗓 Day View</h4>
          <p>24-hour timeline. All-day events in header area. Timed events positioned absolutely by start + duration. Current time indicator with red dot + line.</p>
        </div>
        <div class="feature-card">
          <h4>🔄 Google Calendar Sync</h4>
          <p>OAuth2 via googleapis. Syncs events into Whoami. Two-way: events created in Whoami push to Google Calendar. Auto-sync on page load (once per session). Manual sync button.</p>
        </div>
        <div class="feature-card">
          <h4>📥 iCal Import</h4>
          <p>Upload .ics files to bulk-import events. Parsed server-side, stored as CalendarEvent records with source="ical". Supports VEVENT format with DTSTART/DTEND.</p>
        </div>
        <div class="feature-card">
          <h4>🔔 Reminders</h4>
          <p>Due date + time, optional notes, repeat (daily/weekly/monthly). Mark done → moves to Completed section. Standalone /reminders page + calendar sidebar panel. Overdue highlighted in red.</p>
        </div>
      </div>

      <hr class="divider"/>
      <h3>Event Colors</h3>
      <div class="section">
        <p style="margin-bottom:8px;">Events have 8 color options. Google events map colorIds 1–11 to named colors. Source-based fallback: local=indigo, google=blue, ical=purple.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${[['indigo','#6366f1'],['blue','#3b82f6'],['green','#22c55e'],['yellow','#eab308'],['orange','#f97316'],['red','#ef4444'],['purple','#a855f7'],['pink','#ec4899']].map(([n,c]) => `
            <div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block;"></span><span style="font-size:11px;color:#a1a1aa;">${n}</span></div>
          `).join('')}
        </div>
      </div>

      <hr class="divider"/>
      <h3>API Routes</h3>
      <div class="section">
        ${[
          ['GET',   '/api/calendar/events', 'List events in date range (start/end params)'],
          ['POST',  '/api/calendar/events', 'Create event locally + push to Google Calendar'],
          ['DEL',   '/api/calendar/events/[id]', 'Delete event locally + remove from Google Calendar'],
          ['GET',   '/api/calendar/google/status', 'Check if Google Calendar is connected'],
          ['GET',   '/api/calendar/google/connect', 'Generate Google OAuth2 URL (scope: calendar)'],
          ['GET',   '/api/calendar/google/callback', 'Handle OAuth2 callback, store tokens'],
          ['POST',  '/api/calendar/google/sync', 'Pull latest events from Google Calendar'],
          ['DEL',   '/api/calendar/google/disconnect', 'Remove connection + delete synced events'],
          ['POST',  '/api/calendar/import', 'Import .ics file (multipart/form-data)'],
          ['GET',   '/api/calendar/reminders', 'List pending, overdue, and recently done reminders'],
          ['POST',  '/api/calendar/reminders', 'Create reminder with title, notes, dueAt, repeat'],
          ['PATCH', '/api/calendar/reminders/[id]', 'Update reminder (mark done, change due date, etc.)'],
          ['DEL',   '/api/calendar/reminders/[id]', 'Delete reminder permanently'],
        ].map(([m, p, d]) => `
          <div class="api-row">
            <span class="method ${m.toLowerCase()}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc">${d}</span>
          </div>
        `).join('')}
      </div>

      ${footer('Phase 4 — Calendar & Reminders · Google Sync, iCal, Views')}
    </body></html>`,
  },

  {
    filename: 'whoami-phase5-analytics.pdf',
    title: 'Phase 5 — Analytics',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css}</style></head><body>
      ${header('Phase 5 — Analytics', 'Personal analytics engine: mood trends, journal frequency, budget breakdown, savings progress, net worth, cash flow.')}

      <span class="badge green">✓ Complete</span>

      <div class="feature-grid">
        <div class="feature-card">
          <h4>😊 Mood Chart</h4>
          <p>Area chart (Recharts) showing daily mood over the selected month. Gradient fill with indigo/violet. Dots on each entry. Hover tooltip with date + mood label.</p>
        </div>
        <div class="feature-card">
          <h4>📓 Journal Frequency</h4>
          <p>Bar chart showing entries per week/month. Streak counter (days in a row with entries). Grace period: streak doesn't reset at midnight if you haven't written yet today.</p>
        </div>
        <div class="feature-card">
          <h4>💰 Budget Breakdown</h4>
          <p>Pie/donut chart showing spending by category. Recharts PieChart with custom legend. Hover shows category + amount + % of total spending.</p>
        </div>
        <div class="feature-card">
          <h4>🎯 Savings Progress</h4>
          <p>Card showing all savings goals with progress bars, current/target amounts, emoji labels, and completion percentage. Color-coded per goal's chosen color.</p>
        </div>
        <div class="feature-card">
          <h4>📊 Net Worth Card</h4>
          <p>Sum of all linked bank account balances. Shows individual account breakdown. Updates on each Plaid sync.</p>
        </div>
        <div class="feature-card">
          <h4>💸 Cash Flow Chart</h4>
          <p>6-month stacked bar chart: income (emerald) vs spending (rose). Each bar shows month label. Net cash flow line overlay. Powered by Recharts ComposedChart.</p>
        </div>
      </div>

      <hr class="divider"/>
      <h3>Overview API</h3>
      <div class="section">
        <p style="margin-bottom:10px;">Single aggregated endpoint for dashboard stats:</p>
        ${[
          ['GET', '/api/analytics/overview', 'totalSpentThisMonth, avgMoodThisMonth, journalEntriesThisMonth, netWorth, journalStreak, upcomingReminders'],
          ['GET', '/api/analytics/mood', 'Daily mood entries for selected month'],
          ['GET', '/api/analytics/journal', 'Journal entry counts by week/month for frequency chart'],
          ['GET', '/api/analytics/budget', 'Category spending totals for pie chart'],
          ['GET', '/api/analytics/savings', 'All savings goals with progress data'],
          ['GET', '/api/analytics/cashflow', 'Monthly income vs spending for last 6 months'],
        ].map(([m, p, d]) => `
          <div class="api-row">
            <span class="method ${m.toLowerCase()}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc" style="font-size:10px;">${d}</span>
          </div>
        `).join('')}
      </div>

      <hr class="divider"/>
      <h3>Dashboard Quick Stats</h3>
      <div class="section">
        <p>The main dashboard (<code>/dashboard</code>) shows a condensed view powered by the same APIs:</p>
        <div class="feature-grid" style="margin-top:12px;">
          <div class="feature-card"><h4>Net Worth</h4><p>Sum of all linked accounts</p></div>
          <div class="feature-card"><h4>Monthly Income</h4><p>Negative-amount transactions (credits)</p></div>
          <div class="feature-card"><h4>Monthly Spending</h4><p>Positive-amount transactions (debits)</p></div>
          <div class="feature-card"><h4>Net Cash Flow</h4><p>Income − Spending, surplus/deficit label</p></div>
          <div class="feature-card"><h4>Cash Flow Bars</h4><p>Last 6 months income vs spending inline mini-bars</p></div>
          <div class="feature-card"><h4>Top 5 Categories</h4><p>Horizontal bars, sorted by spend amount</p></div>
        </div>
      </div>

      ${footer('Phase 5 — Analytics · Recharts, Aggregations, Dashboard')}
    </body></html>`,
  },

  {
    filename: 'whoami-phase6-notes.pdf',
    title: 'Phase 6 — Notes',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css}</style></head><body>
      ${header('Phase 6 — Notes', 'Full CRUD notes module with two-pane editor, color themes, tags, pin, auto-save, and full-text search.')}

      <span class="badge green">✓ Complete</span>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Two-Pane Layout</h4>
          <ul>
            <li>Left sidebar: note list with search, tag filter chips</li>
            <li>Right pane: full editor with toolbar</li>
            <li>Empty state: create-first-note prompt</li>
            <li>Note count in sidebar footer</li>
            <li>Height: <code>calc(100vh - 4rem)</code> with overflow hidden</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Auto-Save</h4>
          <ul>
            <li>Title, content, and tags auto-save on every keystroke</li>
            <li>800ms debounce (saveTimer ref)</li>
            <li>"Auto-saved" status indicator in toolbar</li>
            <li>New notes require explicit "Create Note" click</li>
            <li>After creation, switches to edit mode (auto-save enabled)</li>
          </ul>
        </div>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Color Themes</h4>
          <ul>
            <li>6 color options: default, indigo, emerald, amber, rose, purple</li>
            <li>Color affects background + border of editor pane</li>
            <li>Color dot shown in sidebar list for colored notes</li>
            <li>Circle color picker in editor toolbar</li>
            <li>Auto-saved on color change</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Tags & Search</h4>
          <ul>
            <li>Comma-separated tag input, blur triggers save</li>
            <li>Tag filter chips in sidebar (All + per-tag buttons)</li>
            <li>Full-text search: title + content (iLike)</li>
            <li>300ms debounced search re-fetch</li>
            <li>Search + tag filter can combine</li>
            <li>All tags shown dynamically from current note set</li>
          </ul>
        </div>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Pin Notes</h4>
          <ul>
            <li>📌 Pin button in editor toolbar</li>
            <li>Pinned notes sort to top of list</li>
            <li>Pin icon shown in sidebar list item</li>
            <li>Toggle: pin → unpin on same click</li>
            <li>Auto-saved immediately on toggle</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Database Schema</h4>
          <ul>
            <li><code>Note</code> model: id, userId, title, content (Text), tags (String[]), pinned (Boolean), color (String?)</li>
            <li>Indexes: userId, (userId + pinned)</li>
            <li>Order: pinned DESC, updatedAt DESC</li>
            <li>Cascade delete when user deleted</li>
          </ul>
        </div>
      </div>

      <hr class="divider"/>
      <h3>API Routes</h3>
      <div class="section">
        ${[
          ['GET',   '/api/notes', 'List notes ordered by pinned→updatedAt; supports ?q= search and ?tag= filter'],
          ['POST',  '/api/notes', 'Create new note with title, content, tags, pinned, color'],
          ['GET',   '/api/notes/[id]', 'Get single note (ownership verified)'],
          ['PATCH', '/api/notes/[id]', 'Update any fields: title, content, tags, pinned, color'],
          ['DEL',   '/api/notes/[id]', 'Delete note (ownership verified before delete)'],
        ].map(([m, p, d]) => `
          <div class="api-row">
            <span class="method ${m.toLowerCase()}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc">${d}</span>
          </div>
        `).join('')}
      </div>

      <hr class="divider"/>
      <h3>Sidebar List Item</h3>
      <div class="section">
        <p>Each note in the sidebar shows:</p>
        <ul style="margin-top:6px;">
          <li>Color dot (if colored) + 📌 pin icon (if pinned)</li>
          <li>Title (truncated to one line)</li>
          <li>Content preview (2-line clamp, "Empty note" if blank)</li>
          <li>Relative timestamp (just now / Xm / Xh / Xd / date)</li>
          <li>First 2 tags as mini chips</li>
        </ul>
      </div>

      ${footer('Phase 6 — Notes · CRUD, Auto-Save, Color Themes, Tags')}
    </body></html>`,
  },

  {
    filename: 'whoami-api-reference.pdf',
    title: 'Full API Reference',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${css} body { font-size: 12px; }</style></head><body>
      ${header('Full API Reference', 'All API routes across every phase — auth, budget, journal, calendar, reminders, notes, analytics, notifications.')}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <h3>Auth & User</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['POST','GET'],
              ['/api/auth/register','/api/auth/session'],
              ['Register user','Get session'],
            ]}
            ${[
              ['POST', '/api/auth/register', 'Register with email + password'],
              ['GET',  '/api/auth/session', 'Get current session user'],
              ['POST', '/api/auth/signout', 'Sign out and clear session'],
            ].map(([m,p,d]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>

          <h3>Plaid / Budget</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['POST', '/api/plaid/link-token',''],
              ['POST', '/api/plaid/exchange-token',''],
              ['GET',  '/api/plaid/accounts',''],
              ['POST', '/api/plaid/sync',''],
              ['GET',  '/api/plaid/transactions',''],
              ['GET',  '/api/budget',''],
              ['POST', '/api/budget',''],
              ['GET',  '/api/budget/cashflow',''],
              ['GET',  '/api/savings-goals',''],
              ['POST', '/api/savings-goals',''],
              ['PATCH','/api/savings-goals/[id]',''],
              ['DEL',  '/api/savings-goals/[id]',''],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>

          <h3>Journal</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['GET',   '/api/journal'],
              ['POST',  '/api/journal'],
              ['GET',   '/api/journal/[id]'],
              ['PATCH', '/api/journal/[id]'],
              ['DEL',   '/api/journal/[id]'],
              ['GET',   '/api/journal/calendar'],
              ['GET',   '/api/journal/tags'],
              ['POST',  '/api/journal/pin'],
              ['POST',  '/api/journal/[id]/unlock'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>
        </div>

        <div>
          <h3>Calendar & Reminders</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['GET',   '/api/calendar/events'],
              ['POST',  '/api/calendar/events'],
              ['DEL',   '/api/calendar/events/[id]'],
              ['GET',   '/api/calendar/google/status'],
              ['GET',   '/api/calendar/google/connect'],
              ['GET',   '/api/calendar/google/callback'],
              ['POST',  '/api/calendar/google/sync'],
              ['DEL',   '/api/calendar/google/disconnect'],
              ['POST',  '/api/calendar/import'],
              ['GET',   '/api/calendar/reminders'],
              ['POST',  '/api/calendar/reminders'],
              ['PATCH', '/api/calendar/reminders/[id]'],
              ['DEL',   '/api/calendar/reminders/[id]'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>

          <h3>Notes</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['GET',   '/api/notes'],
              ['POST',  '/api/notes'],
              ['GET',   '/api/notes/[id]'],
              ['PATCH', '/api/notes/[id]'],
              ['DEL',   '/api/notes/[id]'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>

          <h3>Analytics</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['GET', '/api/analytics/overview'],
              ['GET', '/api/analytics/mood'],
              ['GET', '/api/analytics/journal'],
              ['GET', '/api/analytics/budget'],
              ['GET', '/api/analytics/savings'],
              ['GET', '/api/analytics/cashflow'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>

          <h3>Notifications</h3>
          <div class="section">
            ${[
              ['GET',  '/api/notifications'],
              ['PATCH','/api/notifications/[id]'],
              ['POST', '/api/notifications/mark-all-read'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>
        </div>
      </div>

      ${footer('Full API Reference · All 40+ Routes')}
    </body></html>`,
  },
];

// ─── Generate PDFs ─────────────────────────────────────────────────────────────
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const doc of docs) {
  const page = await browser.newPage();
  await page.setContent(doc.html(BASE_CSS), { waitUntil: 'networkidle0' });
  const outPath = join(OUT_DIR, doc.filename);
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await page.close();
  console.log(`✓ ${doc.filename}`);
}

await browser.close();
console.log(`\n📄 All PDFs saved to: ${OUT_DIR}`);
