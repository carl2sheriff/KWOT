import { prisma } from '@/lib/db'
import { updateInvoiceSchema } from '@/lib/schemas'
import { calculateTotals, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/invoices/[id] - Single invoice
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      salesBu: { select: { id: true, name: true, code: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
          productiveBu: { select: { id: true, name: true, code: true } },
        },
        orderBy: { position: 'asc' },
      },
      payments: {
        include: {
          receivedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      schedule: {
        orderBy: { installmentNumber: 'asc' },
      },
      quote: { select: { id: true, reference: true } },
    },
  })

  if (!invoice) {
    return apiError('Facture introuvable', 404)
  }

  return apiSuccess(invoice)
})

// ============================================
// PUT /api/invoices/[id] - Update invoice
// ============================================
export const PUT = withApiMiddleware(async (req, context) => {
  const { id } = await context.params

  // Check if invoice exists and is DRAFT
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, status: true, amountPaid: true },
  })

  if (!existing) {
    return apiError('Facture introuvable', 404)
  }

  if (existing.status !== 'DRAFT') {
    return apiError('Seules les factures en brouillon peuvent etre modifiees', 400)
  }

  const body = await req.json()
  const validation = updateInvoiceSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Extract optional revenue attribution fields (not in schema, validated manually)
  const sellerId = body.sellerId !== undefined ? (body.sellerId || null) : undefined
  const salesBuId = body.salesBuId !== undefined ? (body.salesBuId || null) : undefined

  // Calculate new totals if items are provided
  let totals = undefined
  if (data.items) {
    totals = calculateTotals(
      data.items.map((item) => ({
        quantity: item.quantity!,
        unitPrice: item.unitPrice!,
        discount: item.discount || 0,
        taxRate: item.taxRate ?? data.taxRate ?? 20,
      })),
      data.taxRate ?? 20,
      data.discount ?? 0,
      'PERCENTAGE'
    )
  }

  const invoice = await prisma.$transaction(async (tx) => {
    // Delete existing items if new ones provided
    if (data.items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
    }

    const updated = await tx.invoice.update({
      where: { id },
      data: {
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.projectId !== undefined && { projectId: data.projectId || null }),
        ...(data.dueDate && { dueDate: data.dueDate }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.terms !== undefined && { terms: data.terms || null }),
        ...(sellerId !== undefined && { sellerId }),
        ...(salesBuId !== undefined && { salesBuId }),
        ...(totals && {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
          amountDue: Math.max(0, totals.total - Number(existing.amountPaid)),
        }),
        ...(data.items && {
          items: {
            create: data.items.map((item, index) => {
              // Extract productiveBuId from the raw body items (not in schema)
              const rawItem = body.items?.[index]
              const productiveBuId = rawItem?.productiveBuId && typeof rawItem.productiveBuId === 'string'
                ? rawItem.productiveBuId
                : null

              return {
                productId: item.productId || null,
                description: item.description!,
                quantity: item.quantity!,
                unitPrice: item.unitPrice!,
                discount: item.discount || 0,
                taxRate: item.taxRate ?? data.taxRate ?? 20,
                total: calculateItemTotal(item.quantity!, item.unitPrice!, item.discount || 0),
                productiveBuId,
                position: index + 1,
              }
            }),
          },
        }),
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

    return updated
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'invoice',
    entityId: invoice.id,
    metadata: { reference: invoice.reference },
  })

  return apiSuccess(invoice)
})

// ============================================
// DELETE /api/invoices/[id] - Delete invoice
// ============================================
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, status: true, reference: true },
  })

  if (!existing) {
    return apiError('Facture introuvable', 404)
  }

  if (existing.status !== 'DRAFT') {
    return apiError('Seules les factures en brouillon peuvent etre supprimees', 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
    await tx.invoice.delete({ where: { id } })
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'invoice',
    entityId: id,
    metadata: { reference: existing.reference },
  })

  return apiSuccess({ deleted: true })
})
