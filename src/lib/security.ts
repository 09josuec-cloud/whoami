/**
 * Sanitize a string by trimming whitespace and removing dangerous characters.
 * This is a defense-in-depth measure — Zod validation is the primary guard.
 */
export function sanitizeInput(str: string): string {
  return str
    .trim()
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters except tab, newline, carriage return
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Extract the real client IP address from request headers.
 * Respects common proxy headers in order of trustworthiness.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Cloudflare
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Standard forwarded header (RFC 7239)
  const forwarded = headers.get("forwarded");
  if (forwarded) {
    const match = forwarded.match(/for="?\[?([^\]",;]+)/i);
    if (match?.[1]) return match[1].trim();
  }

  // De-facto standard proxy header
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Take the first (client) IP from the comma-separated list
    const first = xForwardedFor.split(",")[0];
    if (first) return first.trim();
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "unknown";
}

/**
 * Build the Content-Security-Policy header value.
 * Adjust allowed sources as your project grows.
 */
export function buildCsp(nonce?: string): string {
  const nonceDirective = nonce ? `'nonce-${nonce}'` : "";

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": `'self' ${nonceDirective} 'strict-dynamic'`,
    "style-src": "'self' 'unsafe-inline'", // Tailwind requires unsafe-inline for now
    "img-src": "'self' data: blob:",
    "font-src": "'self'",
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "object-src": "'none'",
    "upgrade-insecure-requests": "",
  };

  return Object.entries(directives)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join("; ");
}
