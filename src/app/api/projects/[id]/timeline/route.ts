import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'

// ============================================
// GET /api/projects/[id]/timeline - Get project activity timeline
// ============================================
export const GET = withApiMiddleware(async (req, context) => {
  const { id } = await context.params
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '50')

  // 1. Get all related entity IDs
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      quotes: { select: { id: true } },
      invoices: { select: { id: true } },
      purchaseOrders: { select: { id: true } },
    },
  })

  if (!project) return apiError('Projet non trouve', 404)

  // Collect all entity IDs
  const entityIds = [
    ...project.quotes.map(q => q.id),
    ...project.invoices.map(i => i.id),
    ...project.purchaseOrders.map(po => po.id),
  ]

  // Also get payment IDs from invoices and credit note IDs
  const payments = await prisma.payment.findMany({
    where: { invoiceId: { in: project.invoices.map(i => i.id) } },
    select: { id: true },
  })
  const creditNotes = await prisma.creditNote.findMany({
    where: { invoiceId: { in: project.invoices.map(i => i.id) } },
    select: { id: true },
  })

  entityIds.push(
    ...payments.map(p => p.id),
    ...creditNotes.map(cn => cn.id),
  )

  if (entityIds.length === 0) {
    return apiSuccess([])
  }

  // 2. Fetch audit logs
  const logs = await prisma.auditLog.findMany({
    where: { entityId: { in: entityIds } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return apiSuccess(logs)
})
