interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// In-memory store — swap for Redis in production
const store = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Clean up expired entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export function rateLimit(
  identifier: string,
  options?: { maxAttempts?: number; windowMs?: number }
): RateLimitResult {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    // First request or window expired — start fresh
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      remaining: maxAttempts - 1,
      reset: resetAt,
    };
  }

  if (entry.count >= maxAttempts) {
    return {
      success: false,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  entry.count += 1;
  store.set(identifier, entry);

  return {
    success: true,
    remaining: maxAttempts - entry.count,
    reset: entry.resetAt,
  };
}

export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}
