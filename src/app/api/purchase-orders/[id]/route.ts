import { prisma } from '@/lib/db'
import { updatePurchaseOrderSchema } from '@/lib/schemas'
import { calculateTotals, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/purchase-orders/[id] - Single purchase order
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!purchaseOrder) {
    return apiError('Bon de commande introuvable', 404)
  }

  return apiSuccess(purchaseOrder)
})

// ============================================
// PUT /api/purchase-orders/[id] - Update purchase order
// ============================================
export const PUT = withApiMiddleware(async (req, context) => {
  const { id } = await context.params

  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { id: true, status: true, reference: true },
  })

  if (!existing) {
    return apiError('Bon de commande introuvable', 404)
  }

  const body = await req.json()

  // Handle status change
  if (body.status && body.status !== existing.status) {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SENT', 'CANCELLED'],
      SENT: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['RECEIVED', 'CANCELLED'],
    }

    const allowed = validTransitions[existing.status] || []
    if (!allowed.includes(body.status)) {
      return apiError(
        `Transition de statut invalide: ${existing.status} -> ${body.status}`,
        400
      )
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: body.status },
      include: {
        supplier: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    })

    await createAuditLog({
      userId: TEMP_USER_ID,
      action: 'STATUS_CHANGE',
      entityType: 'purchaseOrder',
      entityId: id,
      metadata: {
        reference: existing.reference,
        from: existing.status,
        to: body.status,
      },
    })

    return apiSuccess(updated)
  }

  // Regular update (DRAFT only)
  if (existing.status !== 'DRAFT') {
    return apiError('Seuls les bons de commande en brouillon peuvent etre modifies', 400)
  }

  const validation = updatePurchaseOrderSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Calculate new totals if items are provided
  let totals = undefined
  if (data.items) {
    totals = calculateTotals(
      data.items.map((item) => ({
        quantity: item.quantity!,
        unitPrice: item.unitPrice!,
        discount: 0,
      })),
      data.taxRate ?? 20,
      0,
      'PERCENTAGE'
    )
  }

  const purchaseOrder = await prisma.$transaction(async (tx) => {
    // Delete existing items if new ones provided
    if (data.items) {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })
    }

    const updated = await tx.purchaseOrder.update({
      where: { id },
      data: {
        ...(data.supplierId && { supplierId: data.supplierId }),
        ...(data.projectId !== undefined && { projectId: data.projectId || null }),
        ...(data.expectedDelivery !== undefined && {
          expectedDelivery: data.expectedDelivery || null,
        }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(totals && {
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
        }),
        ...(data.items && {
          items: {
            create: data.items.map((item, index) => ({
              productId: item.productId || null,
              description: item.description!,
              quantity: item.quantity!,
              unitPrice: item.unitPrice!,
              total: calculateItemTotal(item.quantity!, item.unitPrice!, 0),
              position: index + 1,
            })),
          },
        }),
      },
      include: {
        supplier: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    })

    return updated
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'purchaseOrder',
    entityId: purchaseOrder.id,
    metadata: { reference: purchaseOrder.reference },
  })

  return apiSuccess(purchaseOrder)
})

// ============================================
// DELETE /api/purchase-orders/[id] - Delete purchase order
// ============================================
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { id: true, status: true, reference: true },
  })

  if (!existing) {
    return apiError('Bon de commande introuvable', 404)
  }

  if (existing.status !== 'DRAFT') {
    return apiError('Seuls les bons de commande en brouillon peuvent etre supprimes', 400)
  }

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })
    await tx.purchaseOrder.delete({ where: { id } })
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'purchaseOrder',
    entityId: id,
    metadata: { reference: existing.reference },
  })

  return apiSuccess({ deleted: true })
})
