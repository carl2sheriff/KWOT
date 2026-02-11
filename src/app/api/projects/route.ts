import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/projects - List projects
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const clientId = searchParams.get('clientId') || ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (clientId) {
    where.clientId = clientId
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        _count: { select: { tasks: true, quotes: true, invoices: true, purchaseOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ])

  return apiSuccess(projects, buildPagination(page, limit, total))
})

// ============================================
// POST /api/projects - Create project
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()

  if (!body.name || !body.clientId) {
    return apiError('Nom et client requis', 400)
  }

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

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description || null,
      status: body.status || 'draft',
      clientId: body.clientId,
      ownerId: TEMP_USER_ID,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      budget: body.budget || null,
    },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  })

  return apiSuccess(project)
})
