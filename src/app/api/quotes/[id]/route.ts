import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { updateQuoteSchema } from '@/lib/schemas'
import { calculateTotals, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog, diffChanges } from '@/lib/audit'

// Hardcoded user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// GET /api/quotes/[id] - Get single quote with all relations
export const GET = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      items: {
        orderBy: { position: 'asc' },
        include: { product: true },
      },
      versions: {
        orderBy: { version: 'desc' },
        include: {
          changedBy: { select: { id: true, name: true } },
        },
      },
      milestones: {
        orderBy: { position: 'asc' },
        include: {
          invoice: {
            select: { id: true, reference: true, status: true, total: true },
          },
        },
      },
    },
  })

  if (!quote) {
    return apiError('Devis non trouve', 404)
  }

  return apiSuccess(quote)
})

// PUT /api/quotes/[id] - Update quote
export const PUT = withApiMiddleware(async (
  req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const body = await req.json()
  const parsed = updateQuoteSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('Validation error', 400, parsed.error.flatten().fieldErrors)
  }

  const existing = await prisma.quote.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!existing) {
    return apiError('Devis non trouve', 404)
  }

  const { items, milestones, ...updateData } = parsed.data

  // Calculate totals if items provided
  let totals = null
  if (items) {
    totals = calculateTotals(
      items.map(i => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount || 0,
        taxRate: i.taxRate ?? updateData.taxRate ?? Number(existing.taxRate),
      })),
      updateData.taxRate ?? Number(existing.taxRate),
      updateData.discount ?? Number(existing.discount),
      (updateData.discountType ?? existing.discountType) as 'PERCENTAGE' | 'FIXED',
    )
  } else if (updateData.taxRate !== undefined || updateData.discount !== undefined || updateData.discountType !== undefined) {
    totals = calculateTotals(
      existing.items.map(i => ({
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        taxRate: Number(i.taxRate),
      })),
      updateData.taxRate ?? Number(existing.taxRate),
      updateData.discount ?? Number(existing.discount),
      (updateData.discountType ?? existing.discountType) as 'PERCENTAGE' | 'FIXED',
    )
  }

  const quote = await prisma.$transaction(async (tx) => {
    if (items) {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } })
      await tx.quoteItem.createMany({
        data: items.map((item, index) => ({
          quoteId: id,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate ?? updateData.taxRate ?? Number(existing.taxRate),
          total: calculateItemTotal(item.quantity, item.unitPrice, item.discount || 0),
          position: index + 1,
        })),
      })
    }

    // Handle milestones update: delete those not yet invoiced, recreate
    if (milestones !== undefined) {
      // Validate percentages sum to 100
      if (milestones.length > 0) {
        const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new Error(`Les pourcentages des echeances doivent totaliser 100% (actuellement ${totalPercentage}%)`)
        }
      }

      // Only delete milestones that are not yet linked to an invoice
      await tx.quoteMilestone.deleteMany({
        where: { quoteId: id, invoiceId: null },
      })

      if (milestones.length > 0) {
        // Get remaining invoiced milestones to determine position offset
        const invoicedMilestones = await tx.quoteMilestone.findMany({
          where: { quoteId: id, invoiceId: { not: null } },
        })
        const positionOffset = invoicedMilestones.length

        await tx.quoteMilestone.createMany({
          data: milestones.map((m, index) => ({
            quoteId: id,
            label: m.label,
            percentage: m.percentage,
            position: positionOffset + index + 1,
          })),
        })
      }
    }

    const dataToUpdate: Record<string, unknown> = {
      version: { increment: 1 },
    }

    if (updateData.clientId !== undefined) dataToUpdate.clientId = updateData.clientId
    if (updateData.projectId !== undefined) dataToUpdate.projectId = updateData.projectId || null
    if (updateData.validUntil !== undefined) dataToUpdate.validUntil = updateData.validUntil || null
    if (updateData.taxRate !== undefined) dataToUpdate.taxRate = updateData.taxRate
    if (updateData.discount !== undefined) dataToUpdate.discount = updateData.discount
    if (updateData.discountType !== undefined) dataToUpdate.discountType = updateData.discountType
    if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes || null
    if (updateData.terms !== undefined) dataToUpdate.terms = updateData.terms || null

    if (totals) {
      dataToUpdate.subtotal = totals.subtotal
      dataToUpdate.taxAmount = totals.taxAmount
      dataToUpdate.total = totals.total
    }

    const updated = await tx.quote.update({
      where: { id },
      data: dataToUpdate,
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
          include: {
            invoice: {
              select: { id: true, reference: true, status: true, total: true },
            },
          },
        },
      },
    })

    await tx.quoteVersion.create({
      data: {
        quoteId: id,
        version: updated.version,
        data: JSON.parse(JSON.stringify(updated)),
        changedById: TEMP_USER_ID,
      },
    })

    return updated
  })

  const changes = diffChanges(
    existing as unknown as Record<string, unknown>,
    quote as unknown as Record<string, unknown>,
  )
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'quote',
    entityId: quote.id,
    changes,
  })

  return apiSuccess(quote)
})

// PATCH /api/quotes/[id] - Update quote (alias for PUT)
export const PATCH = PUT;

// DELETE /api/quotes/[id] - Delete quote (only DRAFT)
export const DELETE = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const existing = await prisma.quote.findUnique({ where: { id } })

  if (!existing) {
    return apiError('Devis non trouve', 404)
  }

  if (existing.status !== 'DRAFT') {
    return apiError('Seuls les devis en brouillon peuvent etre supprimes', 400)
  }

  await prisma.quote.delete({ where: { id } })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'quote',
    entityId: id,
    metadata: { reference: existing.reference },
  })

  return apiSuccess({ deleted: true })
})
