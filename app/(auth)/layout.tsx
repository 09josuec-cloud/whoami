import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Whoami",
    default: "Whoami",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      {/* Subtle radial gradient backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent)",
        }}
        aria-hidden="true"
      />
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
          <span className="text-lg font-bold text-white">W</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-zinc-100">
          Whoami
        </span>
      </div>
      {children}
    </div>
  );
}
