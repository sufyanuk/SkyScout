import "server-only";

/**
 * Tiny in-memory fixed-window rate limiter. Good enough for a single server.
 * On serverless/multi-instance deployments swap it for a shared store
 * (e.g. Upstash Redis) — the interface stays the same.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
