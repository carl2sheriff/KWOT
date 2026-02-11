import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createPaymentSchema } from '@/lib/schemas'
import { generateReference } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'
import { Prisma } from '@prisma/client'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/payments - List payments
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const method = searchParams.get('method') || ''
  const invoiceId = searchParams.get('invoiceId') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { invoice: { reference: { contains: search, mode: 'insensitive' } } },
      { invoice: { client: { name: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (method) {
    where.method = method
  }

  if (invoiceId) {
    where.invoiceId = invoiceId
  }

  if (dateFrom || dateTo) {
    where.paidAt = {}
    if (dateFrom) where.paidAt.gte = new Date(dateFrom)
    if (dateTo) where.paidAt.lte = new Date(dateTo)
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            reference: true,
            client: { select: { id: true, name: true } },
          },
        },
        receivedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ])

  return apiSuccess(payments, buildPagination(page, limit, total))
})

// ============================================
// POST /api/payments - Create payment
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const validation = createPaymentSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Generate reference
  const reference = await generateReference('payment')

  // Create payment and update invoice in transaction
  const payment = await prisma.$transaction(async (tx) => {
    // Verify invoice exists
    const invoice = await tx.invoice.findUnique({
      where: { id: data.invoiceId },
      select: { id: true, status: true, amountPaid: true, amountDue: true, total: true, reference: true },
    })

    if (!invoice) {
      throw new Error('Facture introuvable')
    }

    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED' || invoice.status === 'CREDITED') {
      throw new Error('Cette facture ne peut pas recevoir de paiement')
    }

    // Prevent overpayment
    if (new Prisma.Decimal(data.amount).greaterThan(invoice.amountDue)) {
      throw new Error('Le montant depasse le solde restant')
    }

    // Create payment
    const created = await tx.payment.create({
      data: {
        reference,
        invoiceId: data.invoiceId,
        receivedById: TEMP_USER_ID,
        amount: data.amount,
        method: data.method,
        status: 'COMPLETED',
        paidAt: data.paidAt || new Date(),
        notes: data.notes || null,
        isDeposit: data.isDeposit,
      },
      include: {
        invoice: {
          select: {
            id: true,
            reference: true,
            client: { select: { id: true, name: true } },
          },
        },
        receivedBy: { select: { id: true, name: true } },
      },
    })

    // Update invoice amounts
    const newAmountPaid = new Prisma.Decimal(invoice.amountPaid).add(new Prisma.Decimal(data.amount))
    const newAmountDue = new Prisma.Decimal(invoice.total).sub(newAmountPaid)

    // Determine new invoice status
    let newStatus: string
    if (newAmountDue.lessThanOrEqualTo(0)) {
      newStatus = 'PAID'
    } else if (newAmountPaid.greaterThan(0)) {
      newStatus = 'PARTIALLY_PAID'
    } else {
      newStatus = invoice.status
    }

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue.lessThan(0) ? 0 : newAmountDue,
        status: newStatus as 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'CREDITED',
      },
    })

    return created
  })

  // Create audit log
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'PAYMENT',
    entityType: 'payment',
    entityId: payment.id,
    metadata: {
      reference: payment.reference,
      invoiceId: data.invoiceId,
      amount: data.amount,
      method: data.method,
    },
  })

  return apiSuccess(payment)
})
