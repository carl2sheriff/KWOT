import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createClientSchema } from '@/lib/schemas'
import { Prisma } from '@prisma/client'

// Hardcoded user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// GET /api/clients - List clients
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const where: Prisma.ClientWhereInput = {}

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Status filter
  if (status) {
    where.status = status
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { projects: true, contacts: true, quotes: true, invoices: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ])

  return apiSuccess(clients, buildPagination(page, limit, total))
})

// POST /api/clients - Create client
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = createClientSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('Validation error', 400, parsed.error.flatten().fieldErrors)
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

  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      createdById: TEMP_USER_ID,
    },
  })

  return apiSuccess(client)
})
