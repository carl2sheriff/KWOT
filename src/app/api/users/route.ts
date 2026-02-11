import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { createAuditLog } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/users - List all users
// ============================================
export const GET = withApiMiddleware(async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hourlyRate: true,
    },
    orderBy: { name: 'asc' },
  })

  return apiSuccess(users)
})

// ============================================
// PUT /api/users - Update user hourly rates (batch)
// ============================================
export const PUT = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const { rates } = body

  if (!rates || !Array.isArray(rates)) {
    return apiError('Format invalide: { rates: [{ userId, hourlyRate }] }', 400)
  }

  const updates = []
  for (const entry of rates) {
    if (!entry.userId || typeof entry.userId !== 'string') continue
    const rate = entry.hourlyRate !== null && entry.hourlyRate !== undefined && entry.hourlyRate !== ''
      ? parseFloat(entry.hourlyRate)
      : null

    updates.push(
      prisma.user.update({
        where: { id: entry.userId },
        data: { hourlyRate: rate },
        select: { id: true, name: true, hourlyRate: true },
      })
    )
  }

  const results = await Promise.all(updates)

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'user',
    entityId: TEMP_USER_ID,
    metadata: { action: 'batch_rate_update', count: results.length },
  })

  return apiSuccess(results)
})
