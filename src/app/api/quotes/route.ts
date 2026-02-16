import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createQuoteSchema } from '@/lib/schemas'
import { generateReference, calculateTotals, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { Prisma } from '@prisma/client'

// Hardcoded user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// GET /api/quotes - List quotes with filters
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const clientId = searchParams.get('clientId') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  const where: Prisma.QuoteWhereInput = {}

  // Search filter
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { company: { contains: search, mode: 'insensitive' } } },
    ]
  }

  // Status filter
  if (status) {
    where.status = status as Prisma.EnumQuoteStatusFilter
  }

  // Client filter
  if (clientId) {
    where.clientId = clientId
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        project: {
          select: { 
            id: true, 
            name: true,
            owner: { select: { id: true, name: true } }
          },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.quote.count({ where }),
  ])

  return apiSuccess(quotes, buildPagination(page, limit, total))
})

// POST /api/quotes - Create new quote
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = createQuoteSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('Validation error', 400, parsed.error.flatten().fieldErrors)
  }

  const { items, milestones, ...quoteData } = parsed.data

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

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: quoteData.clientId } })
  if (!client) {
    return apiError('Client non trouve', 404)
  }

  // Generate reference
  const reference = await generateReference('quote')

  // Calculate totals
  const totals = calculateTotals(
    items.map(i => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount || 0,
      taxRate: i.taxRate ?? quoteData.taxRate ?? 20,
    })),
    quoteData.taxRate ?? 20,
    quoteData.discount ?? 0,
    quoteData.discountType ?? 'PERCENTAGE',
  )

  // Validate milestone percentages sum to 100
  if (milestones && milestones.length > 0) {
    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return apiError(
        `Les pourcentages des echeances doivent totaliser 100% (actuellement ${totalPercentage}%)`,
        400
      )
    }
  }

  // Create quote with items in a transaction
  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        reference,
        clientId: quoteData.clientId,
        projectId: quoteData.projectId || null,
        createdById: TEMP_USER_ID,
        validUntil: quoteData.validUntil || null,
        taxRate: quoteData.taxRate ?? 20,
        discount: quoteData.discount ?? 0,
        discountType: quoteData.discountType ?? 'PERCENTAGE',
        notes: quoteData.notes || null,
        terms: quoteData.terms || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: {
          create: items.map((item, index) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            taxRate: item.taxRate ?? quoteData.taxRate ?? 20,
            total: calculateItemTotal(item.quantity, item.unitPrice, item.discount || 0),
            position: index + 1,
          })),
        },
      },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        items: {
          orderBy: { position: 'asc' },
          include: { product: true },
        },
      },
    })

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      await tx.quoteMilestone.createMany({
        data: milestones.map((m, index) => ({
          quoteId: created.id,
          label: m.label,
          percentage: m.percentage,
          position: index + 1,
        })),
      })
    }

    // Re-fetch with milestones included
    const withMilestones = await tx.quote.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        items: {
          orderBy: { position: 'asc' },
          include: { product: true },
        },
        milestones: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return withMilestones
  })

  // Create audit log
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'quote',
    entityId: quote.id,
    metadata: { reference: quote.reference },
  })

  return apiSuccess(quote)
})
