import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createInvoiceSchema } from '@/lib/schemas'
import { generateReference, calculateTotals, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/invoices - List invoices
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const clientId = searchParams.get('clientId') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const overdue = searchParams.get('overdue') === 'true'

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (clientId) {
    where.clientId = clientId
  }

  if (dateFrom || dateTo) {
    where.issueDate = {}
    if (dateFrom) where.issueDate.gte = new Date(dateFrom)
    if (dateTo) where.issueDate.lte = new Date(dateTo)
  }

  if (overdue) {
    where.dueDate = { lt: new Date() }
    where.status = { notIn: ['PAID', 'CANCELLED', 'CREDITED'] }
  }

  // Auto-update SENT invoices past due date to OVERDUE
  await prisma.invoice.updateMany({
    where: { status: 'SENT', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  })

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        salesBu: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ])

  return apiSuccess(invoices, buildPagination(page, limit, total))
})

// ============================================
// POST /api/invoices - Create invoice
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const validation = createInvoiceSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Extract optional revenue attribution fields (not in schema, validated manually)
  const sellerId = body.sellerId && typeof body.sellerId === 'string' ? body.sellerId : null
  const salesBuId = body.salesBuId && typeof body.salesBuId === 'string' ? body.salesBuId : null

  // Generate reference
  const reference = await generateReference('invoice')

  // Calculate totals
  const totals = calculateTotals(
    data.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      taxRate: item.taxRate ?? data.taxRate ?? 20,
    })),
    data.taxRate,
    data.discount,
    'PERCENTAGE'
  )

  // Create invoice with items in transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        reference,
        quoteId: data.quoteId || null,
        clientId: data.clientId,
        projectId: data.projectId || null,
        createdById: TEMP_USER_ID,
        sellerId,
        salesBuId,
        status: 'DRAFT',
        dueDate: data.dueDate,
        subtotal: totals.subtotal,
        taxRate: data.taxRate,
        taxAmount: totals.taxAmount,
        discount: data.discount,
        total: totals.total,
        amountPaid: 0,
        amountDue: totals.total,
        notes: data.notes || null,
        terms: data.terms || null,
        items: {
          create: data.items.map((item, index) => {
            // Extract productiveBuId from the raw body items (not in schema)
            const rawItem = body.items?.[index]
            const productiveBuId = rawItem?.productiveBuId && typeof rawItem.productiveBuId === 'string'
              ? rawItem.productiveBuId
              : null

            return {
              productId: item.productId || null,
              description: item.description,
              section: item.section || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              taxRate: item.taxRate ?? data.taxRate ?? 20,
              total: calculateItemTotal(item.quantity, item.unitPrice, item.discount || 0),
              productiveBuId,
              position: index + 1,
            }
          }),
        },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        salesBu: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            productiveBu: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    return created
  })

  // Create audit log
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'invoice',
    entityId: invoice.id,
    metadata: { reference: invoice.reference },
  })

  return apiSuccess(invoice)
})
