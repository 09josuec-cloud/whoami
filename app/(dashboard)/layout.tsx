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
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors w-full"
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
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-zinc-800 bg-zinc-950">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">
            Whoami
          </span>
        </div>

        {/* Navigation — client component for active state */}
        <SidebarNav />

        {/* User footer */}
        <div className="border-t border-zinc-800 p-3">
          <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {userName}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-sm">
          <div className="flex flex-1 items-center justify-between">
            <div />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-sm text-zinc-400">
                Welcome back,{" "}
                <span className="font-medium text-zinc-200">
                  {session?.user?.name ?? "there"}
                </span>
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {initials || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
