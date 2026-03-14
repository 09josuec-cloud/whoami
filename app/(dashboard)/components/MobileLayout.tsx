'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';

// ── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const bottomTabs = [
  { href: '/dashboard', label: 'Home', Icon: HomeIcon },
  { href: '/budget', label: 'Budget', Icon: WalletIcon },
  { href: '/journal', label: 'Journal', Icon: BookIcon },
  { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
];

const allNav = [
  { href: '/dashboard', label: 'Dashboard', emoji: '🏠' },
  { href: '/budget', label: 'Budget', emoji: '💳' },
  { href: '/journal', label: 'Journal', emoji: '📖' },
  { href: '/calendar', label: 'Calendar', emoji: '📅' },
  { href: '/analytics', label: 'Analytics', emoji: '📊' },
  { href: '/habits', label: 'Habits & Health', emoji: '❤️' },
  { href: '/notes', label: 'Notes', emoji: '📝' },
  { href: '/reminders', label: 'Reminders', emoji: '🔔' },
  { href: '/assistant', label: 'AI Assistant', emoji: '✨' },
  { href: '/settings', label: 'Settings', emoji: '⚙️' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface MobileLayoutProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  initials: string;
  signOutForm: React.ReactNode;
}

export default function MobileLayout({ children, userName, initials, signOutForm }: MobileLayoutProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#09090b] overflow-hidden">
      {/* ── Header ── */}
      <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#0e0e12]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-600">
            <span className="text-xs font-bold text-white">W</span>
          </div>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">whoami</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white">
              {initials || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain p-4 pb-24">
        {children}
      </main>

      {/* ── Bottom tab bar ── */}
      <nav className="shrink-0 border-t border-white/[0.06] bg-[#0e0e12]">
        <div className="flex items-stretch">
          {bottomTabs.map(({ href, label, Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 relative transition-colors',
                  isActive ? 'text-indigo-400' : 'text-zinc-600 active:text-zinc-400',
                ].join(' ')}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-indigo-400" />
                )}
                <Icon />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* More */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={[
              'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors',
              drawerOpen ? 'text-indigo-400' : 'text-zinc-600 active:text-zinc-400',
            ].join(' ')}
          >
            <GridIcon />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
        {/* iPhone home indicator safe area */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>

      {/* ── Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-80 bg-[#0e0e12] border-r border-white/[0.06] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600">
                  <span className="text-sm font-bold text-white">W</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">whoami</p>
                  <p className="text-[10px] text-zinc-500">Personal OS</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300"
              >
                <XIcon />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              {allNav.map(({ href, label, emoji }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      'flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm transition-colors',
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]',
                    ].join(' ')}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* User footer */}
            <div className="border-t border-white/[0.06] p-4 space-y-2">
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                  {initials || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{userName}</p>
                </div>
              </div>
              {signOutForm}
            </div>

            {/* Safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
