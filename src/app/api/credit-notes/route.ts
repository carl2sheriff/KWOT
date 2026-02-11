import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createCreditNoteSchema } from '@/lib/schemas'
import { generateReference, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/credit-notes - List credit notes
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

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

  const [creditNotes, total] = await Promise.all([
    prisma.creditNote.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        invoice: { select: { id: true, reference: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.creditNote.count({ where }),
  ])

  return apiSuccess(creditNotes, buildPagination(page, limit, total))
})

// ============================================
// POST /api/credit-notes - Create credit note
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const validation = createCreditNoteSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Fetch source invoice and verify
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    select: { id: true, clientId: true, status: true, amountDue: true },
  })

  if (!invoice) {
    return apiError('Facture introuvable', 404)
  }

  if (invoice.status === 'CANCELLED') {
    return apiError('Impossible de creer un avoir pour une facture annulee', 400)
  }

  // Generate reference
  const reference = await generateReference('creditNote')

  // Calculate totals
  const itemsWithTotals = data.items.map((item) => ({
    ...item,
    total: calculateItemTotal(item.quantity, item.unitPrice),
  }))

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = itemsWithTotals.reduce(
    (sum, item) => sum + Math.round(item.total * (item.taxRate ?? 20) / 100 * 100) / 100,
    0
  )
  const total = Math.round((subtotal + taxAmount) * 100) / 100

  // Create credit note in transaction
  const creditNote = await prisma.$transaction(async (tx) => {
    const created = await tx.creditNote.create({
      data: {
        reference,
        invoiceId: data.invoiceId,
        clientId: invoice.clientId,
        createdById: TEMP_USER_ID,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        reason: data.reason || null,
        notes: data.notes || null,
        items: {
          create: itemsWithTotals.map((item, index) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate ?? 20,
            total: item.total,
            position: index + 1,
          })),
        },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        invoice: { select: { id: true, reference: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    })

    // DRAFT credit note: no invoice changes
    // Invoice is only updated when credit note status changes to APPLIED

    return created
  })

  // Create audit log
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREDIT',
    entityType: 'creditNote',
    entityId: creditNote.id,
    metadata: { reference: creditNote.reference, invoiceId: data.invoiceId },
  })

  return apiSuccess(creditNote)
})
