import type { Metadata } from "next";
import { auth } from "@/src/lib/auth";
import { signOut } from "@/src/lib/auth";
import SidebarNav from "./components/SidebarNav";
import NotificationBell from "./components/NotificationBell";

export const metadata: Metadata = {
  title: {
    template: "%s | Whoami",
    default: "Dashboard | Whoami",
  },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

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
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200 transition-all duration-150 w-full"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
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
      <aside className="flex flex-col w-[220px] shrink-0 bg-[#0e0e12] border-r border-white/[0.06]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            W
          </div>
          <span className="text-sm font-semibold text-white">whoami</span>
        </div>

        {/* Navigation — client component for active state */}
        <SidebarNav />

        {/* User footer */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 mb-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
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
        <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              {getGreeting()},{" "}
              <span className="font-medium text-zinc-100">{firstName}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">{formatDate()}</span>
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
