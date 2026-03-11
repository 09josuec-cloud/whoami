import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — no Node.js native imports (no argon2, no prisma)
// Used by proxy.ts for session checking on every request
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // Providers are added in auth.ts (server-only)
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
      const isPublic =
        publicRoutes.includes(pathname) ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/auth/forgot-password") ||
        pathname.startsWith("/api/auth/reset-password") ||
        pathname.startsWith("/api/auth/verify-email") ||
        pathname.startsWith("/_next") ||
        /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname);

      if (isPublic) return true;
      if (isLoggedIn) return true;

      // Redirect unauthenticated users to login
      return false;
    },
  },
};
