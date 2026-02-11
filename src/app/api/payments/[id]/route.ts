import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { Prisma } from '@prisma/client'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/payments/[id] - Single payment
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
          amountPaid: true,
          amountDue: true,
          client: { select: { id: true, name: true, company: true } },
        },
      },
      receivedBy: { select: { id: true, name: true } },
    },
  })

  if (!payment) {
    return apiError('Paiement introuvable', 404)
  }

  return apiSuccess(payment)
})

// ============================================
// DELETE /api/payments/[id] - Delete payment (reverse invoice amounts)
// ============================================
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      amount: true,
      invoiceId: true,
      invoice: {
        select: { id: true, amountPaid: true, amountDue: true, total: true, status: true },
      },
    },
  })

  if (!existing) {
    return apiError('Paiement introuvable', 404)
  }

  // Reverse invoice amounts in transaction
  await prisma.$transaction(async (tx) => {
    // Delete payment
    await tx.payment.delete({ where: { id } })

    // Recalculate invoice amounts
    const newAmountPaid = new Prisma.Decimal(existing.invoice.amountPaid).sub(new Prisma.Decimal(existing.amount))
    const newAmountDue = new Prisma.Decimal(existing.invoice.total).sub(
      newAmountPaid.lessThan(0) ? new Prisma.Decimal(0) : newAmountPaid
    )

    // Determine status
    let newStatus: string
    if (newAmountPaid.lessThanOrEqualTo(0)) {
      newStatus = 'SENT'
    } else if (newAmountDue.lessThanOrEqualTo(0)) {
      newStatus = 'PAID'
    } else {
      newStatus = 'PARTIALLY_PAID'
    }

    await tx.invoice.update({
      where: { id: existing.invoiceId },
      data: {
        amountPaid: newAmountPaid.lessThan(0) ? 0 : newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus as 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'CREDITED',
      },
    })
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'payment',
    entityId: id,
    metadata: {
      reference: existing.reference,
      invoiceId: existing.invoiceId,
      amount: existing.amount.toString(),
    },
  })

  return apiSuccess({ deleted: true })
})
