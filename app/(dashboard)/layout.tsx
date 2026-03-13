import type { Metadata } from "next";
import { auth } from "@/src/lib/auth";
import { signOut } from "@/src/lib/auth";
import SidebarNav from "./components/SidebarNav";
import NotificationBell from "./components/NotificationBell";
import GreetingHeader, { DateBadge } from "./components/GreetingHeader";

export const metadata: Metadata = {
  title: {
    template: "%s | Whoami",
    default: "Dashboard | Whoami",
  },
};


async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 transition-all duration-150 w-full"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
        </svg>
        Sign out
      </button>
    </form>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userName = session?.user?.name ?? session?.user?.email ?? "User";
  const userEmail = session?.user?.email ?? "";
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");

  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden">
      {/* Sidebar */}
      <aside className="flex flex-col w-[240px] shrink-0 bg-[#0e0e12] border-r border-white/[0.06]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
          <div className="relative h-8 w-8 rounded-xl overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-600" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">W</div>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">whoami</p>
            <p className="text-[10px] text-zinc-500">Personal OS</p>
          </div>
        </div>

        {/* Navigation — client component for active state */}
        <SidebarNav />

        {/* User footer */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 mb-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white/[0.08] text-xs font-semibold text-white">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">
                {userName}
              </p>
              {userEmail && (
                <p className="truncate text-xs text-zinc-500">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="relative z-10 h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <GreetingHeader firstName={firstName} />
          </div>
          <div className="flex items-center gap-3">
            <DateBadge />
            <div className="h-4 w-px bg-white/[0.06]" aria-hidden="true" />
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
