import { config } from '../config/env.js';
import { AppError } from '../shared/errors.js';
import type { RateLimitTier } from '../shared/http.js';

/**
 * Framework-neutral fixed-window rate limiter (in-memory).
 * For multi-instance deployments swap the store for Redis (REDIS_ENABLED) — the interface stays the same.
 */
const TIERS: Record<RateLimitTier, { windowMs: number; max: number }> = {
  default: { windowMs: 60_000, max: 300 },
  auth: { windowMs: 15 * 60_000, max: 20 },
  upload: { windowMs: 60_000, max: 30 },
  strict: { windowMs: 60_000, max: 10 },
};

const buckets = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}, 60_000).unref();

export function checkRateLimit(tier: RateLimitTier, identity: string, routeKey: string) {
  if (config.isTest) return;
  const { windowMs, max } = TIERS[tier];
  const key = `${tier}:${routeKey}:${identity}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > max) {
    throw new AppError(429, 'RATE_LIMITED', 'Too many requests. Please slow down and try again shortly.', {
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    });
  }
}

export function resetRateLimits() {
  buckets.clear();
}
