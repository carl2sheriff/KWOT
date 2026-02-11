import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/business-units - List business units
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (active === 'true') {
    where.isActive = true
  } else if (active === 'false') {
    where.isActive = false
  }

  const businessUnits = await prisma.businessUnit.findMany({
    where,
    include: {
      _count: {
        select: {
          projects: true,
          invoicesSales: true,
          itemsProductive: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return apiSuccess(businessUnits)
})

// ============================================
// POST /api/business-units - Create business unit
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()

  const { name, code } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiError('Le nom est requis', 400)
  }

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return apiError('Le code est requis', 400)
  }

  // Check uniqueness
  const existing = await prisma.businessUnit.findFirst({
    where: {
      OR: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() },
      ],
    },
  })

  if (existing) {
    if (existing.name === name.trim()) {
      return apiError('Une business unit avec ce nom existe deja', 400)
    }
    return apiError('Une business unit avec ce code existe deja', 400)
  }

  const businessUnit = await prisma.businessUnit.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase(),
    },
    include: {
      _count: {
        select: {
          projects: true,
          invoicesSales: true,
          itemsProductive: true,
        },
      },
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'business_unit',
    entityId: businessUnit.id,
    metadata: { name: businessUnit.name, code: businessUnit.code },
  })

  return apiSuccess(businessUnit)
})
