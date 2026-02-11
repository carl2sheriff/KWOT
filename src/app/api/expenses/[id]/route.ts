import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createAuditLog, diffChanges } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

const VALID_CATEGORIES = ['transport', 'location', 'catering', 'equipment', 'props', 'other']

// GET /api/expenses/[id] - Get single expense
export const GET = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  if (!expense) {
    return apiError('Depense non trouvee', 404)
  }

  return apiSuccess(expense)
})

// PUT /api/expenses/[id] - Update expense
export const PUT = withApiMiddleware(async (
  req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const existing = await prisma.expense.findUnique({ where: { id } })
  if (!existing) {
    return apiError('Depense non trouvee', 404)
  }

  if (existing.invoiced) {
    return apiError('Impossible de modifier une depense deja facturee', 400)
  }

  const body = await req.json()
  const { projectId, category, description, amount, date, receiptUrl, billable, markupPercent, notes } = body

  // Validate category if provided
  if (category && !VALID_CATEGORIES.includes(category)) {
    return apiError(`Categorie invalide. Valeurs acceptees: ${VALID_CATEGORIES.join(', ')}`, 400)
  }

  // Validate project if changed
  if (projectId && projectId !== existing.projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return apiError('Projet non trouve', 404)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (projectId !== undefined) updateData.projectId = projectId
  if (category !== undefined) updateData.category = category
  if (description !== undefined) updateData.description = description
  if (amount !== undefined) updateData.amount = Number(amount)
  if (date !== undefined) updateData.date = new Date(date)
  if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl || null
  if (billable !== undefined) updateData.billable = billable
  if (markupPercent !== undefined) updateData.markupPercent = Number(markupPercent)
  if (notes !== undefined) updateData.notes = notes || null

  const expense = await prisma.expense.update({
    where: { id },
    data: updateData,
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  const changes = diffChanges(
    existing as unknown as Record<string, unknown>,
    updateData
  )

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'expense',
    entityId: id,
    changes,
  })

  return apiSuccess(expense)
})

// DELETE /api/expenses/[id] - Delete expense
export const DELETE = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const existing = await prisma.expense.findUnique({ where: { id } })
  if (!existing) {
    return apiError('Depense non trouvee', 404)
  }

  if (existing.invoiced) {
    return apiError('Impossible de supprimer une depense deja facturee', 400)
  }

  await prisma.expense.delete({ where: { id } })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'expense',
    entityId: id,
  })

  return apiSuccess({ deleted: true })
})
