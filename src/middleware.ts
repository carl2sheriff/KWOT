import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'

// Rate limit configuration per route pattern
const RATE_LIMITS: { pattern: RegExp; limit: number; windowSeconds: number }[] = [
  // Webhooks: stricter rate limit
  { pattern: /^\/api\/webhooks\//, limit: 30, windowSeconds: 60 },
  // Extranet (supplier portal): moderate
  { pattern: /^\/api\/extranet\//, limit: 40, windowSeconds: 60 },
  // Auth endpoints: strict to prevent brute force
  { pattern: /^\/api\/auth\//, limit: 10, windowSeconds: 60 },
  // All other API routes: standard
  { pattern: /^\/api\//, limit: 100, windowSeconds: 60 },
]

function applyRateLimit(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl

  // Skip health check
  if (pathname === '/api/health') return null

  const ip = getRateLimitKey(req)

  const config = RATE_LIMITS.find((r) => r.pattern.test(pathname))
  if (!config) return null

  const key = `${ip}:${config.pattern.source}`
  const result = checkRateLimit(key, { limit: config.limit, windowSeconds: config.windowSeconds })

  if (!result.allowed) {
    return NextResponse.json(
      { success: false, error: 'Trop de requetes. Reessayez plus tard.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    )
  }

  return null
}

// Export Auth.js middleware with rate limiting
export default auth((req) => {
  const { pathname } = req.nextUrl

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = applyRateLimit(req)
    if (rateLimitResponse) return rateLimitResponse
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
