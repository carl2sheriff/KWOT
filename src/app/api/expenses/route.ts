import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { Prisma } from '@prisma/client'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

const VALID_CATEGORIES = ['transport', 'location', 'catering', 'equipment', 'props', 'other']

// GET /api/expenses - List expenses
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const projectId = searchParams.get('projectId') || ''
  const category = searchParams.get('category') || ''
  const billable = searchParams.get('billable')
  const invoiced = searchParams.get('invoiced')
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  const where: Prisma.ExpenseWhereInput = {}

  if (projectId) {
    where.projectId = projectId
  }

  if (category) {
    where.category = category
  }

  if (billable !== null && billable !== '') {
    where.billable = billable === 'true'
  }

  if (invoiced !== null && invoiced !== '') {
    where.invoiced = invoiced === 'true'
  }

  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) {
      where.date.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.date.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.count({ where }),
  ])

  const totals = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  })

  return apiSuccess(
    {
      expenses,
      summary: {
        totalAmount: totals._sum.amount ? parseFloat(totals._sum.amount.toString()) : 0,
        count: totals._count,
      },
    },
    buildPagination(page, limit, total),
  )
})

// POST /api/expenses - Create expense
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()

  const { projectId, category, description, amount, date, receiptUrl, billable, markupPercent, notes } = body

  if (!projectId) {
    return apiError('projectId est requis', 400)
  }

  if (!category) {
    return apiError('category est requis', 400)
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return apiError(`Categorie invalide. Valeurs acceptees: ${VALID_CATEGORIES.join(', ')}`, 400)
  }

  if (!description) {
    return apiError('description est requis', 400)
  }

  if (amount === undefined || amount === null) {
    return apiError('amount est requis', 400)
  }

  // Validate project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return apiError('Projet non trouve', 404)
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

  const expense = await prisma.expense.create({
    data: {
      projectId,
      userId: TEMP_USER_ID,
      category,
      description,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      receiptUrl: receiptUrl || null,
      billable: billable !== undefined ? billable : true,
      markupPercent: markupPercent !== undefined ? Number(markupPercent) : 0,
      notes: notes || null,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'expense',
    entityId: expense.id,
    changes: { projectId, category, description, amount },
  })

  return apiSuccess(expense)
})
