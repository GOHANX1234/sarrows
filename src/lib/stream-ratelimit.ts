/**
 * Best-effort in-memory rate limiter for streaming endpoints.
 * Not a substitute for a shared store (Redis) under multi-instance deployment,
 * but stops a single scraping script from hammering /api/stream/* for this process.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic sweep so the map doesn't grow unbounded. Guard against duplicate
// intervals being registered across Next.js dev hot-reloads.
const globalKey = "__sarrows_stream_rl_sweep__";
if (!(global as any)[globalKey]) {
  (global as any)[globalKey] = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }, 60_000);
}

/**
 * @returns true if the request is allowed, false if the caller is over the limit.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
