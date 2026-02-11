import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createSupplierSchema } from '@/lib/schemas'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/suppliers - List suppliers
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status) {
    where.status = status
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ])

  return apiSuccess(suppliers, buildPagination(page, limit, total))
})

// ============================================
// POST /api/suppliers - Create supplier
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const validation = createSupplierSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Ensure temp user exists
  await prisma.user.upsert({
    where: { id: TEMP_USER_ID },
    update: {},
    create: {
      id: TEMP_USER_ID,
      email: 'admin@kwot.fr',
      name: 'Admin KWOT',
      role: 'admin',
    },
  })

  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      siret: data.siret || null,
      notes: data.notes || null,
    },
  })

  return apiSuccess(supplier)
})
