import { NextRequest, NextResponse } from 'next/server'

// ============================================
// API Response Helpers
// ============================================

export function apiSuccess<T>(data: T, pagination?: PaginationMeta) {
  return NextResponse.json({
    success: true,
    data,
    ...(pagination && { pagination }),
  })
}

export function apiError(message: string, status: number = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  )
}

// ============================================
// Types
// ============================================

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: unknown
  pagination?: PaginationMeta
}

interface MiddlewareOptions {
  requireAuth?: boolean
  requiredRoles?: string[]
}

type RouteContext = { params: Promise<Record<string, string>> }

type ApiHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse>

// ============================================
// Middleware Wrapper
// ============================================

export function withApiMiddleware(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): ApiHandler {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      // TODO: Add auth check when auth is implemented
      // if (options.requireAuth) { ... }
      // if (options.requiredRoles) { ... }

      return await handler(req, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        return apiError(error.message, 500)
      }

      return apiError('Internal server error', 500)
    }
  }
}

// ============================================
// Pagination Helper
// ============================================

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
