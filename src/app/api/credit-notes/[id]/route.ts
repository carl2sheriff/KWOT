import { prisma } from '@/lib/db'
import { createCreditNoteSchema } from '@/lib/schemas'
import { calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { Prisma } from '@prisma/client'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/credit-notes/[id] - Single credit note
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const creditNote = await prisma.creditNote.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
      invoice: { select: { id: true, reference: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!creditNote) {
    return apiError('Avoir introuvable', 404)
  }

  return apiSuccess(creditNote)
})

// ============================================
// PUT /api/credit-notes/[id] - Update credit note
// ============================================
export const PUT = withApiMiddleware(async (req, context) => {
  const { id } = await context.params

  // Check if credit note exists and is DRAFT
  const existing = await prisma.creditNote.findUnique({
    where: { id },
    select: { id: true, status: true, invoiceId: true },
  })

  if (!existing) {
    return apiError('Avoir introuvable', 404)
  }

  const body = await req.json()

  // Handle status change
  if (body.status && body.status !== existing.status) {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SENT'],
      SENT: ['APPLIED'],
    }

    const allowed = validTransitions[existing.status] || []
    if (!allowed.includes(body.status)) {
      return apiError(
        `Transition de statut invalide: ${existing.status} -> ${body.status}`,
        400
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.creditNote.update({
        where: { id },
        data: { status: body.status },
        include: {
          client: { select: { id: true, name: true, company: true } },
          invoice: { select: { id: true, reference: true } },
          createdBy: { select: { id: true, name: true } },
          items: true,
        },
      })

      // When credit note is APPLIED, update the source invoice
      if (body.status === 'APPLIED') {
        const invoice = await tx.invoice.findUnique({
          where: { id: existing.invoiceId },
          select: { id: true, amountDue: true },
        })

        if (invoice) {
          const newAmountDue = new Prisma.Decimal(invoice.amountDue).sub(new Prisma.Decimal(result.total))

          await tx.invoice.update({
            where: { id: existing.invoiceId },
            data: {
              status: 'CREDITED',
              amountDue: newAmountDue.lessThan(0) ? 0 : newAmountDue,
            },
          })
        }
      }

      return result
    })

    await createAuditLog({
      userId: TEMP_USER_ID,
      action: 'STATUS_CHANGE',
      entityType: 'creditNote',
      entityId: id,
      metadata: {
        reference: updated.reference,
        from: existing.status,
        to: body.status,
      },
    })

    return apiSuccess(updated)
  }

  // Regular update (DRAFT only)
  if (existing.status !== 'DRAFT') {
    return apiError('Seuls les avoirs en brouillon peuvent etre modifies', 400)
  }

  const validation = createCreditNoteSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Calculate new totals
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

  const creditNote = await prisma.$transaction(async (tx) => {
    // Delete existing items
    await tx.creditNoteItem.deleteMany({ where: { creditNoteId: id } })

    const updated = await tx.creditNote.update({
      where: { id },
      data: {
        reason: data.reason || null,
        notes: data.notes || null,
        subtotal,
        taxAmount,
        total,
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

    return updated
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'creditNote',
    entityId: creditNote.id,
    metadata: { reference: creditNote.reference },
  })

  return apiSuccess(creditNote)
})

// ============================================
// DELETE /api/credit-notes/[id] - Delete credit note
// ============================================
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.creditNote.findUnique({
    where: { id },
    select: { id: true, status: true, reference: true },
  })

  if (!existing) {
    return apiError('Avoir introuvable', 404)
  }

  if (existing.status !== 'DRAFT') {
    return apiError('Seuls les avoirs en brouillon peuvent etre supprimes', 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.creditNoteItem.deleteMany({ where: { creditNoteId: id } })
    await tx.creditNote.delete({ where: { id } })
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'creditNote',
    entityId: id,
    metadata: { reference: existing.reference },
  })

  return apiSuccess({ deleted: true })
})
