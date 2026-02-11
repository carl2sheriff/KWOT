import { prisma } from '@/lib/db'
import { updateSupplierSchema } from '@/lib/schemas'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'

// ============================================
// GET /api/suppliers/[id] - Single supplier
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
          orderDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { purchaseOrders: true } },
    },
  })

  if (!supplier) {
    return apiError('Fournisseur introuvable', 404)
  }

  return apiSuccess(supplier)
})

// ============================================
// PUT /api/suppliers/[id] - Update supplier
// ============================================
export const PUT = withApiMiddleware(async (req, context) => {
  const { id } = await context.params

  const existing = await prisma.supplier.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    return apiError('Fournisseur introuvable', 404)
  }

  const body = await req.json()
  const validation = updateSupplierSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.company !== undefined && { company: data.company || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.siret !== undefined && { siret: data.siret || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
  })

  return apiSuccess(supplier)
})

// ============================================
// DELETE /api/suppliers/[id] - Delete supplier
// ============================================
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { purchaseOrders: true } } },
  })

  if (!existing) {
    return apiError('Fournisseur introuvable', 404)
  }

  if (existing._count.purchaseOrders > 0) {
    return apiError('Impossible de supprimer un fournisseur avec des bons de commande', 400)
  }

  await prisma.supplier.delete({ where: { id } })

  return apiSuccess({ deleted: true })
})
