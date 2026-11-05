import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/**
 * Fixed-window, in-memory rate limiter. Correct for a single self-hosted
 * process; move the store to Postgres or Redis before running several instances.
 */
type Bucket = { count: number; resetAt: number };
const globalStore = globalThis as unknown as { bomaRateLimit?: Map<string, Bucket> };
const store = (globalStore.bomaRateLimit ??= new Map());

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, max: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  if (store.size > 50_000) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true };
  }
  if (bucket.count >= max) return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  bucket.count++;
  return { ok: true };
}

/** Peek without counting — pair with recordFailure() for "failures only" limits. */
export function isLimited(key: string, max: number): RateLimitResult {
  const bucket = store.get(key);
  const now = Date.now();
  if (!bucket || bucket.resetAt <= now || bucket.count < max) return { ok: true };
  return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function recordFailure(key: string, windowSeconds: number) {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
  else bucket.count++;
}

export function resetLimit(key: string) {
  store.delete(key);
}

/**
 * Client IP for rate-limit keys only — hashed, never logged or stored raw.
 * Trusts proxy headers set by Cloudflare / the reverse proxy in front of Boma.
 */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}
