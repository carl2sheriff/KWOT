import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/business-units/[id] - Single business unit
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const businessUnit = await prisma.businessUnit.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          projects: true,
          invoicesSales: true,
          itemsProductive: true,
        },
      },
    },
  })

  if (!businessUnit) {
    return apiError('Business unit introuvable', 404)
  }

  return apiSuccess(businessUnit)
})

// ============================================
// PUT /api/business-units/[id] - Update business unit
// ============================================
export const PUT = withApiMiddleware(async (req, context) => {
  const { id } = await context.params

  const existing = await prisma.businessUnit.findUnique({
    where: { id },
  })

  if (!existing) {
    return apiError('Business unit introuvable', 404)
  }

  const body = await req.json()
  const { name, code, isActive } = body

  // Check uniqueness if name or code is being changed
  if (name && name.trim() !== existing.name) {
    const nameExists = await prisma.businessUnit.findFirst({
      where: { name: name.trim(), id: { not: id } },
    })
    if (nameExists) {
      return apiError('Une business unit avec ce nom existe deja', 400)
    }
  }

  if (code && code.trim().toUpperCase() !== existing.code) {
    const codeExists = await prisma.businessUnit.findFirst({
      where: { code: code.trim().toUpperCase(), id: { not: id } },
    })
    if (codeExists) {
      return apiError('Une business unit avec ce code existe deja', 400)
    }
  }

  const businessUnit = await prisma.businessUnit.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(code !== undefined && { code: code.trim().toUpperCase() }),
      ...(isActive !== undefined && { isActive }),
    },
    include: {
      _count: {
        select: {
          projects: true,
          invoicesSales: true,
          itemsProductive: true,
        },
      },
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'business_unit',
    entityId: id,
    metadata: { name: businessUnit.name, code: businessUnit.code },
  })

  return apiSuccess(businessUnit)
})

// ============================================
// DELETE /api/business-units/[id] - Delete business unit
// ============================================
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.businessUnit.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          projects: true,
          invoicesSales: true,
          itemsProductive: true,
        },
      },
    },
  })

  if (!existing) {
    return apiError('Business unit introuvable', 404)
  }

  const linked = []
  if (existing._count.projects > 0) linked.push(`${existing._count.projects} projet(s)`)
  if (existing._count.invoicesSales > 0) linked.push(`${existing._count.invoicesSales} facture(s)`)
  if (existing._count.itemsProductive > 0) linked.push(`${existing._count.itemsProductive} ligne(s) de facture`)

  if (linked.length > 0) {
    return apiError(
      `Impossible de supprimer cette business unit car elle est liee a ${linked.join(', ')}`,
      400
    )
  }

  await prisma.businessUnit.delete({ where: { id } })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'business_unit',
    entityId: id,
    metadata: { name: existing.name, code: existing.code },
  })

  return apiSuccess({ deleted: true })
})
