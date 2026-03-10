import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plaid.com",
      "style-src 'self' 'unsafe-inline' https://cdn.plaid.com",
      "img-src 'self' data: blob: https://*.plaid.com https://plaid-merchant-logos.plaid.com",
      "font-src 'self'",
      "connect-src 'self' https://*.plaid.com https://production.plaid.com https://sandbox.plaid.com",
      "frame-src https://cdn.plaid.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ")
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.delete("X-Powered-By");
  return response;
}

export const proxy = auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const session = (req as { auth?: { user?: unknown } }).auth;

  const publicRoutes = ["/", "/login", "/register"];
  const isPublic =
    publicRoutes.includes(pathname) || pathname.startsWith("/api/auth");

  if (!isPublic && !session?.user) {
    const loginUrl = new URL(
      `/login?callbackUrl=${encodeURIComponent(pathname)}`,
      req.url
    );
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
