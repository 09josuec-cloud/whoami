import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = '/Users/josuecastro/Desktop/whoami-docs';
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
  h2 { font-size: 16px; font-weight: 400; color: #a1a1aa; margin-bottom: 24px; }
  h3 { font-size: 14px; font-weight: 600; color: #e4e4e7; margin-bottom: 10px; margin-top: 20px; }
  h4 { font-size: 12px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; margin-top: 16px; }
  p  { color: #a1a1aa; margin-bottom: 8px; font-size: 12.5px; }
  ul { list-style: none; padding: 0; }
  li { padding: 4px 0 4px 16px; color: #a1a1aa; font-size: 12.5px; position: relative; }
  li::before { content: '·'; position: absolute; left: 4px; color: #6366f1; }
  code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; background: #1c1c1e; border: 1px solid #3f3f46; border-radius: 3px; padding: 1px 5px; color: #a78bfa; }
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
  .env-row { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; border-bottom: 1px solid #1c1c1e; }
  .env-row:last-child { border-bottom: none; }
  .env-key { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; color: #a78bfa; min-width: 220px; }
  .env-desc { font-size: 11px; color: #71717a; }
  .env-req { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 3px; margin-left: auto; white-space: nowrap; }
  .env-req.required { background: rgba(239,68,68,0.15); color: #f87171; }
  .env-req.optional { background: rgba(16,185,129,0.1); color: #6ee7b7; }
`;

function header(title, subtitle) {
  return `
    <div class="header-bar">
      <div>
        <div class="logo">who<span>a</span>mi</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#52525b;">Personal Life OS</div>
        <div style="font-size:11px;color:#3f3f46;">Confidential · March 2026</div>
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
      <p>whoami.company · Personal Life OS</p>
    </div>
  `;
}

// ─── Document definitions ─────────────────────────────────────────────────────
const docs = [

  // ── Overview ────────────────────────────────────────────────────────────────
  {
    filename: 'whoami-overview.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
      ${header('Whoami — Project Overview', 'Personal Life OS: one secure app replacing budgeting, journaling, calendar, notes, reminders, and AI.')}

      <span class="badge green">✓ Phases 1–6 Complete · Phase 7 (AI) Next</span>

      <div class="section">
        <h4>What is Whoami?</h4>
        <p>Whoami is a full-stack personal operating system built as a single secure web application. It replaces fragmented tools — Mint, Day One, Google Calendar, Notion, Reminders, and AI assistants — with one unified platform that never shares data with third parties.</p>
        <p>All data lives in a private PostgreSQL database. Authentication uses Argon2id + JWT sessions. Every module is built with TypeScript strict mode, Next.js 16 App Router, and a dark-first UI with indigo/violet accents. Live at <strong style="color:#818cf8;">whoami.company</strong>.</p>
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
            <span class="stack-pill">Resend email</span>
            <span class="stack-pill">Plaid</span>
          </div>
        </div>
        <div class="section" style="margin:0">
          <h4>Security Stack</h4>
          <ul>
            <li>Argon2id password hashing</li>
            <li>JWT sessions · httpOnly cookies</li>
            <li>7 security headers via middleware (CSP, HSTS…)</li>
            <li>Rate limiting (5 attempts / 15 min / IP)</li>
            <li>Zod validation on all inputs</li>
            <li>Audit logging to database</li>
            <li>Journal PIN with 5-attempt erase</li>
            <li>TOTP two-factor authentication (2FA)</li>
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
            ['Phase 4', 'Calendar & Reminders', 'Google Calendar sync, iCal import, month/week/day views, standalone reminders with repeat support', 'complete'],
            ['Phase 5', 'Analytics', 'Mood chart, journal frequency, budget breakdown, savings progress, net worth, cash flow chart', 'complete'],
            ['Phase 6', 'Notes', 'Full CRUD notes with color themes, tags, pin, auto-save, two-pane editor, full-text search', 'complete'],
            ['Phase 7', 'AI Assistant', 'Context-aware AI using Claude API — answers questions about your finances, mood, and calendar', 'upcoming'],
            ['Phase 8', 'Advanced Modules', 'Habit tracking, goal timeline, health integration, sleep logs', 'upcoming'],
          ].map(([phase, name, desc, status]) => `
            <div class="feature-card">
              <h4>
                <span class="accent-dot ${status === 'complete' ? 'green' : 'amber'}"></span>
                ${phase} — ${name}
              </h4>
              <p>${desc}</p>
              <span style="font-size:10px;color:${status==='complete'?'#34d399':'#f59e0b'};font-weight:600;margin-top:6px;display:block;">${status === 'complete' ? '✓ Complete' : '◦ Upcoming'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <hr class="divider"/>

      <h3>Infrastructure</h3>
      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Domain & Hosting</h4>
          <ul>
            <li>Domain: <strong style="color:#818cf8;">whoami.company</strong> (Squarespace Domains)</li>
            <li>DNS: A record → 76.76.21.21 (Vercel), CNAME www → cname.vercel-dns.com</li>
            <li>Deployed on Vercel (Hobby plan)</li>
            <li>Automatic HTTPS via Let's Encrypt</li>
            <li>Landing page at whoami.company with SEO metadata</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Email</h4>
          <ul>
            <li>Resend for transactional email</li>
            <li>Amazon SES MX records (via Squarespace)</li>
            <li>SPF/DKIM/DMARC configured for @whoami.company</li>
            <li>Email addresses: hello@, support@, privacy@</li>
            <li>Support form at /support → sends to support@whoami.company</li>
            <li>Weekly digest cron job (daily 8am UTC via Vercel)</li>
          </ul>
        </div>
      </div>

      ${footer('Project Overview · March 2026 · whoami.company')}
    </body></html>`,
  },

  // ── Phase 1 ──────────────────────────────────────────────────────────────────
  {
    filename: 'whoami-phase1-foundation.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
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
            <li>TOTP 2FA with backup codes</li>
            <li>Forgot/reset password via email link</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Security Middleware</h4>
          <ul>
            <li>7 security headers: CSP, HSTS, X-Frame-Options, X-Content-Type, Referrer-Policy, Permissions-Policy, X-XSS-Protection</li>
            <li>Rate limiting: 5 attempts / 15 min / IP (in-memory)</li>
            <li>Route protection — all /dashboard/* require session</li>
            <li>Public routes: /, /login, /register, /forgot-password, /reset-password, /verify-email, /terms, /privacy, /support</li>
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
            <li>Server-side UA detection: mobile vs desktop layout</li>
            <li>Desktop: sidebar navigation (240px), active state via usePathname()</li>
            <li>Mobile: full-screen layout, bottom tab bar (Home/Budget/Journal/Calendar/More), slide-out drawer</li>
            <li>Notification bell with unread badge + slide panel</li>
            <li>Dark theme — bg #0a0a0a, indigo/violet accents</li>
            <li>Onboarding wizard (5-step) for new users</li>
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
          ['POST', '/api/auth/forgot-password', 'Send password reset email'],
          ['POST', '/api/auth/reset-password', 'Reset password with token'],
          ['GET',  '/api/auth/2fa/setup', 'Generate TOTP QR code + secret'],
          ['POST', '/api/auth/2fa/enable', 'Verify TOTP code + enable 2FA, returns backup codes'],
          ['POST', '/api/auth/2fa/disable', 'Disable 2FA with current TOTP code'],
          ['GET',  '/api/notifications', 'List notifications + unread count'],
          ['PATCH','/api/notifications/[id]', 'Mark single notification read'],
          ['POST', '/api/notifications/mark-all-read', 'Mark all notifications read'],
          ['POST', '/api/support', 'Submit support request (rate limited 3/hr, sends email)'],
        ].map(([m, p, d]) => `
          <div class="api-row">
            <span class="method ${m.toLowerCase()}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc">${d}</span>
          </div>
        `).join('')}
      </div>

      ${footer('Phase 1 — Foundation · Auth, Security, DB, Mobile Layout')}
    </body></html>`,
  },

  // ── Phase 2 ──────────────────────────────────────────────────────────────────
  {
    filename: 'whoami-phase2-budget.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
      ${header('Phase 2 — Budget', 'Plaid bank sync, transaction management, budgets, subscriptions, savings goals, cash flow, net worth.')}

      <span class="badge green">✓ Complete</span>

      <div class="feature-grid">
        <div class="feature-card">
          <h4>🏦 Plaid Integration</h4>
          <p>Connect real bank accounts via Plaid Link. Sync transactions with cursor-based incremental updates. Supports checking, savings, credit, investment accounts. Currently sandbox mode — production credentials needed for live bank data.</p>
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

  // ── Phase 3 ──────────────────────────────────────────────────────────────────
  {
    filename: 'whoami-phase3-journal.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
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
            <span class="method ${m.toLowerCase()}">${m}</span>
            <span class="api-path">${p}</span>
            <span class="api-desc">${d}</span>
          </div>
        `).join('')}
      </div>

      ${footer('Phase 3 — Journal · TipTap, Mood, PIN Lock')}
    </body></html>`,
  },

  // ── Phase 4 ──────────────────────────────────────────────────────────────────
  {
    filename: 'whoami-phase4-calendar.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
      ${header('Phase 4 — Calendar & Reminders', 'Google Calendar two-way sync, iCal import, month/week/day views, standalone reminders with repeat support.')}

      <span class="badge green">✓ Complete</span>

      <div class="feature-grid">
        <div class="feature-card">
          <h4>📅 Month View</h4>
          <p>6-row × 7-col grid. Event color pills (up to 3 per day). "+N more" opens DayEventsModal. Clicking day number navigates to Day view.</p>
        </div>
        <div class="feature-card">
          <h4>📆 Week View</h4>
          <p>Full time-grid with 56px hourly rows, absolute-positioned event blocks, sticky day headers, current time red line indicator.</p>
        </div>
        <div class="feature-card">
          <h4>🗓 Day View</h4>
          <p>24-hour timeline. All-day events in header area. Timed events positioned absolutely by start + duration. Current time indicator.</p>
        </div>
        <div class="feature-card">
          <h4>🔄 Google Calendar Sync</h4>
          <p>OAuth2 via googleapis. Syncs events into Whoami. Two-way: events created in Whoami push to Google Calendar. Auto-sync on page load. Manual sync button.</p>
        </div>
        <div class="feature-card">
          <h4>📥 iCal Import</h4>
          <p>Upload .ics files to bulk-import events. Parsed server-side, stored as CalendarEvent records with source="ical". Supports VEVENT format.</p>
        </div>
        <div class="feature-card">
          <h4>🔔 Reminders</h4>
          <p>Due date + time, optional notes, repeat (daily/weekly/monthly). Mark done → moves to Completed section. Standalone /reminders page + calendar sidebar panel. Overdue highlighted in red.</p>
        </div>
      </div>

      <hr class="divider"/>
      <h3>API Routes</h3>
      <div class="section">
        ${[
          ['GET',   '/api/calendar/events', 'List events in date range (start/end params)'],
          ['POST',  '/api/calendar/events', 'Create event locally + push to Google Calendar'],
          ['PATCH', '/api/calendar/events/[id]', 'Update event (title, time, color, notes)'],
          ['DEL',   '/api/calendar/events/[id]', 'Delete event locally + remove from Google Calendar'],
          ['GET',   '/api/calendar/google/status', 'Check if Google Calendar is connected'],
          ['GET',   '/api/calendar/google/connect', 'Generate Google OAuth2 URL'],
          ['GET',   '/api/calendar/google/callback', 'Handle OAuth2 callback, store tokens'],
          ['POST',  '/api/calendar/google/sync', 'Pull latest events from Google Calendar'],
          ['DEL',   '/api/calendar/google/disconnect', 'Remove connection + delete synced events'],
          ['POST',  '/api/calendar/import', 'Import .ics file (multipart/form-data)'],
          ['GET',   '/api/calendar/reminders', 'List pending, overdue, and recently done reminders'],
          ['POST',  '/api/calendar/reminders', 'Create reminder with title, notes, dueAt, repeat'],
          ['PATCH', '/api/calendar/reminders/[id]', 'Update reminder (mark done, change due date)'],
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

  // ── Phase 5 ──────────────────────────────────────────────────────────────────
  {
    filename: 'whoami-phase5-analytics.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
      ${header('Phase 5 — Analytics', 'Personal analytics engine: mood trends, journal frequency, budget breakdown, savings progress, net worth, cash flow.')}

      <span class="badge green">✓ Complete</span>

      <div class="feature-grid">
        <div class="feature-card">
          <h4>😊 Mood Chart</h4>
          <p>Area chart (Recharts) showing daily mood over the selected month. Gradient fill with indigo/violet. Dots on each entry. Hover tooltip with date + mood label.</p>
        </div>
        <div class="feature-card">
          <h4>📓 Journal Frequency</h4>
          <p>Bar chart showing entries per week/month. Streak counter (days in a row with entries). Grace period so streak doesn't reset at midnight.</p>
        </div>
        <div class="feature-card">
          <h4>💰 Budget Breakdown</h4>
          <p>Pie/donut chart showing spending by category. Recharts PieChart with custom legend. Hover shows category + amount + % of total spending.</p>
        </div>
        <div class="feature-card">
          <h4>🎯 Savings Progress</h4>
          <p>Card showing all savings goals with progress bars, current/target amounts, emoji labels, and completion percentage.</p>
        </div>
        <div class="feature-card">
          <h4>📊 Net Worth Card</h4>
          <p>Sum of all linked bank account balances. Shows individual account breakdown. Updates on each Plaid sync.</p>
        </div>
        <div class="feature-card">
          <h4>💸 Cash Flow Chart</h4>
          <p>6-month stacked bar chart: income (emerald) vs spending (rose). Net cash flow overlay. Powered by Recharts ComposedChart.</p>
        </div>
      </div>

      <hr class="divider"/>
      <h3>API Routes</h3>
      <div class="section">
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

      ${footer('Phase 5 — Analytics · Recharts, Aggregations, Dashboard')}
    </body></html>`,
  },

  // ── Phase 6 ──────────────────────────────────────────────────────────────────
  {
    filename: 'whoami-phase6-notes.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
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
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Auto-Save</h4>
          <ul>
            <li>Title, content, and tags auto-save on every keystroke</li>
            <li>800ms debounce (saveTimer ref)</li>
            <li>"Auto-saved" status indicator in toolbar</li>
            <li>New notes require explicit "Create Note" click</li>
          </ul>
        </div>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Color Themes</h4>
          <ul>
            <li>6 options: default, indigo, emerald, amber, rose, purple</li>
            <li>Color affects background + border of editor pane</li>
            <li>Color dot shown in sidebar list for colored notes</li>
            <li>Circle color picker in editor toolbar, auto-saved on change</li>
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

      ${footer('Phase 6 — Notes · CRUD, Auto-Save, Color Themes, Tags')}
    </body></html>`,
  },

  // ── Infrastructure ────────────────────────────────────────────────────────────
  {
    filename: 'whoami-infrastructure.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
      ${header('Infrastructure & Deployment', 'Domain, DNS, Vercel deployment, Resend email, environment variables, and cron jobs.')}

      <span class="badge green">✓ Live at whoami.company</span>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Domain</h4>
          <ul>
            <li>Registrar: Squarespace Domains</li>
            <li>Domain: <strong style="color:#818cf8;">whoami.company</strong></li>
            <li>A record: @ → 76.76.21.21 (Vercel IP)</li>
            <li>CNAME: www → cname.vercel-dns.com</li>
            <li>TTL: 3600 (1 hour)</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Hosting (Vercel)</h4>
          <ul>
            <li>Plan: Hobby</li>
            <li>Framework: Next.js (auto-detected)</li>
            <li>Build: <code>next build</code></li>
            <li>Branch: main → auto-deploy</li>
            <li>Cron job: <code>0 8 * * *</code> (daily 8am UTC) — weekly digest</li>
            <li>CRON_SECRET required for cron authorization</li>
          </ul>
        </div>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Email (Resend)</h4>
          <ul>
            <li>Provider: Resend (transactional email)</li>
            <li>DNS (via Squarespace): MX → Amazon SES, SPF/DKIM TXT records</li>
            <li>Domain verified: @whoami.company</li>
            <li>From address: noreply@whoami.company</li>
            <li>Support: support@whoami.company (forwarded to Gmail)</li>
            <li>Hello: hello@whoami.company (forwarded)</li>
            <li>Privacy: privacy@whoami.company (forwarded)</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Database (Neon)</h4>
          <ul>
            <li>Provider: Neon (serverless PostgreSQL)</li>
            <li>Connection via <code>@prisma/adapter-pg</code></li>
            <li>Connection pooling enabled</li>
            <li>Schema managed via Prisma 7</li>
            <li>Migrations: <code>prisma db push</code></li>
          </ul>
        </div>
      </div>

      <hr class="divider"/>
      <h3>Environment Variables</h3>
      <div class="section">
        ${[
          ['DATABASE_URL', 'Neon PostgreSQL connection string (with pooler)', 'required'],
          ['NEXTAUTH_URL', 'https://whoami.company (production)', 'required'],
          ['NEXTAUTH_SECRET', 'Random 32-byte hex — used to sign JWT sessions', 'required'],
          ['RESEND_API_KEY', 'Resend API key for transactional email', 'required'],
          ['EMAIL_FROM', 'noreply@whoami.company — sender address', 'required'],
          ['PLAID_CLIENT_ID', 'Plaid client ID (get from Plaid dashboard)', 'required'],
          ['PLAID_SECRET', 'Plaid secret key (sandbox or production)', 'required'],
          ['PLAID_ENV', 'sandbox | development | production', 'required'],
          ['CRON_SECRET', 'Random hex — authorizes Vercel cron job calls', 'required'],
          ['ANTHROPIC_API_KEY', 'Claude API key — required for AI assistant (Phase 7)', 'optional'],
          ['GOOGLE_CLIENT_ID', 'Google OAuth2 client ID — for Calendar sync', 'optional'],
          ['GOOGLE_CLIENT_SECRET', 'Google OAuth2 client secret', 'optional'],
        ].map(([k, d, r]) => `
          <div class="env-row">
            <span class="env-key">${k}</span>
            <span class="env-desc">${d}</span>
            <span class="env-req ${r}">${r}</span>
          </div>
        `).join('')}
      </div>

      <hr class="divider"/>
      <h3>vercel.json — Cron Job</h3>
      <div class="section">
        <p style="margin-bottom:10px;">Runs daily at 8am UTC. Sends weekly digest emails to users who have opted in. Requires <code>Authorization: Bearer CRON_SECRET</code> header.</p>
        <div style="background:#0f0f0f;border:1px solid #3f3f46;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:11px;color:#a78bfa;">
          { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 8 * * *" }] }
        </div>
      </div>

      ${footer('Infrastructure · Domain, Vercel, Resend, Env Vars')}
    </body></html>`,
  },

  // ── Mobile Layout ─────────────────────────────────────────────────────────────
  {
    filename: 'whoami-mobile-layout.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
      ${header('Mobile Layout Architecture', 'Server-side UA detection separates mobile and desktop experiences. No CSS breakpoint guessing.')}

      <span class="badge">Architecture · March 2026</span>

      <div class="section">
        <h4>Why Server-Side Detection?</h4>
        <p>The previous approach used CSS <code>hidden md:flex</code> on the sidebar to hide it on mobile. This failed on Chrome for iPhone because the browser's reported viewport width was inconsistent, causing the desktop sidebar to render on phones.</p>
        <p>The fix: the server reads the <code>User-Agent</code> header on every request and renders a completely different layout component — no CSS breakpoints involved in the layout switching decision.</p>
      </div>

      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Desktop Layout</h4>
          <ul>
            <li>240px fixed sidebar with logo + SidebarNav + user footer</li>
            <li>SidebarNav: 10 navigation items, active state via usePathname()</li>
            <li>Header: greeting + date badge + notification bell</li>
            <li>Main content: <code>flex-1 overflow-y-auto p-6</code></li>
            <li>Full viewport height: <code>h-screen overflow-hidden</code></li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Mobile Layout</h4>
          <ul>
            <li>No sidebar — full-screen layout</li>
            <li>Sticky header: logo + notification bell + user avatar</li>
            <li>Content: <code>flex-1 overflow-y-auto p-4 pb-24</code></li>
            <li>Bottom tab bar: Home, Budget, Journal, Calendar, More</li>
            <li>More button → slide-out drawer (full nav + sign out)</li>
            <li>iPhone safe area: <code>env(safe-area-inset-bottom)</code></li>
            <li>Viewport: <code>h-[100dvh]</code> (dynamic viewport height)</li>
          </ul>
        </div>
      </div>

      <hr class="divider"/>

      <h3>Detection Logic</h3>
      <div class="section">
        <p style="margin-bottom:10px;">File: <code>src/lib/device.ts</code></p>
        <div style="background:#0f0f0f;border:1px solid #3f3f46;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:11px;color:#a1a1aa;line-height:1.8;">
          <span style="color:#818cf8;">export function</span> <span style="color:#34d399;">isMobileUserAgent</span>(ua: <span style="color:#fbbf24;">string</span>): <span style="color:#fbbf24;">boolean</span> {<br>
          &nbsp;&nbsp;<span style="color:#818cf8;">return</span> /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.<span style="color:#34d399;">test</span>(ua);<br>
          }
        </div>
      </div>

      <div class="section">
        <p style="margin-bottom:10px;">In <code>app/(dashboard)/layout.tsx</code>:</p>
        <div style="background:#0f0f0f;border:1px solid #3f3f46;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:11px;color:#a1a1aa;line-height:1.8;">
          <span style="color:#818cf8;">const</span> headersList = <span style="color:#818cf8;">await</span> <span style="color:#34d399;">headers</span>();<br>
          <span style="color:#818cf8;">const</span> ua = headersList.<span style="color:#34d399;">get</span>(<span style="color:#a3e635;">"user-agent"</span>) ?? <span style="color:#a3e635;">""</span>;<br>
          <span style="color:#818cf8;">const</span> isMobile = <span style="color:#34d399;">isMobileUserAgent</span>(ua);<br><br>
          <span style="color:#818cf8;">if</span> (isMobile) <span style="color:#818cf8;">return</span> &lt;<span style="color:#34d399;">MobileLayout</span> ...&gt;{children}&lt;/<span style="color:#34d399;">MobileLayout</span>&gt;;<br>
          <span style="color:#818cf8;">return</span> &lt;<span style="color:#34d399;">DesktopLayout</span> ...&gt;{children}&lt;/<span style="color:#34d399;">DesktopLayout</span>&gt;;
        </div>
      </div>

      <hr class="divider"/>

      <h3>Mobile Navigation Structure</h3>
      <div class="section-row">
        <div class="section" style="margin:0">
          <h4>Bottom Tabs (Always Visible)</h4>
          <ul>
            <li>🏠 Home → /dashboard</li>
            <li>💳 Budget → /budget</li>
            <li>📖 Journal → /journal</li>
            <li>📅 Calendar → /calendar</li>
            <li>⋮ More → opens full drawer</li>
          </ul>
        </div>
        <div class="section" style="margin:0">
          <h4>Drawer Navigation (All Pages)</h4>
          <ul>
            <li>Dashboard, Budget, Calendar, Journal</li>
            <li>Analytics, Habits & Health</li>
            <li>Notes, Reminders</li>
            <li>AI Assistant, Settings</li>
            <li>User info + Sign out button</li>
          </ul>
        </div>
      </div>

      ${footer('Mobile Layout · Server-Side UA Detection · MobileLayout Component')}
    </body></html>`,
  },

  // ── Full API Reference ─────────────────────────────────────────────────────────
  {
    filename: 'whoami-api-reference.pdf',
    html: (css) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css} body { font-size: 12px; }</style></head><body>
      ${header('Full API Reference', 'All API routes across every module — auth, budget, journal, calendar, notes, analytics, notifications, support.')}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <h3>Auth & User</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['POST', '/api/auth/register'],
              ['GET',  '/api/auth/session'],
              ['POST', '/api/auth/signout'],
              ['POST', '/api/auth/forgot-password'],
              ['POST', '/api/auth/reset-password'],
              ['GET',  '/api/auth/2fa/setup'],
              ['POST', '/api/auth/2fa/enable'],
              ['POST', '/api/auth/2fa/disable'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>

          <h3>Plaid / Budget</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['POST', '/api/plaid/link-token'],
              ['POST', '/api/plaid/exchange-token'],
              ['GET',  '/api/plaid/accounts'],
              ['POST', '/api/plaid/sync'],
              ['GET',  '/api/plaid/transactions'],
              ['GET',  '/api/budget'],
              ['POST', '/api/budget'],
              ['GET',  '/api/budget/cashflow'],
              ['GET',  '/api/savings-goals'],
              ['POST', '/api/savings-goals'],
              ['PATCH','/api/savings-goals/[id]'],
              ['DEL',  '/api/savings-goals/[id]'],
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

          <h3>Support</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['POST', '/api/support'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>
        </div>

        <div>
          <h3>Calendar & Reminders</h3>
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['GET',   '/api/calendar/events'],
              ['POST',  '/api/calendar/events'],
              ['PATCH', '/api/calendar/events/[id]'],
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
          <div class="section" style="margin-bottom:12px;">
            ${[
              ['GET',  '/api/notifications'],
              ['PATCH','/api/notifications/[id]'],
              ['POST', '/api/notifications/mark-all-read'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>

          <h3>Cron</h3>
          <div class="section">
            ${[
              ['POST', '/api/cron/weekly-digest'],
            ].map(([m,p]) => `<div class="api-row"><span class="method ${m.toLowerCase()}">${m}</span><span class="api-path" style="font-size:10px;">${p}</span></div>`).join('')}
          </div>
        </div>
      </div>

      ${footer('Full API Reference · 50+ Routes Across All Modules')}
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
console.log(`\n📄 ${docs.length} PDFs saved to: ${OUT_DIR}`);
