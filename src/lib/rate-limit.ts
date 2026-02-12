/**
 * In-memory rate limiter for API routes.
 * For production at scale, replace with Redis-based solution (e.g. @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

interface RateLimitOptions {
  /** Max requests per window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + options.windowSeconds * 1000
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt }
  }

  entry.count++

  if (entry.count > options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: options.limit - entry.count, resetAt: entry.resetAt }
}

export function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return ip
}
