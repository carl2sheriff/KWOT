import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { createAuditLog } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// GET /api/suppliers/[id]/invoices - List supplier invoices (admin)
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!supplier) {
    return apiError('Fournisseur introuvable', 404)
  }

  const invoices = await prisma.supplierInvoice.findMany({
    where: { supplierId: id },
    include: {
      purchaseOrder: { select: { id: true, reference: true, total: true } },
    },
    orderBy: { submittedAt: 'desc' },
  })

  return apiSuccess(
    invoices.map(inv => ({
      id: inv.id,
      reference: inv.reference,
      fileName: inv.fileName,
      fileSize: inv.fileSize,
      amount: inv.amount ? Number(inv.amount) : null,
      status: inv.status,
      notes: inv.notes,
      reviewNotes: inv.reviewNotes,
      submittedAt: inv.submittedAt,
      reviewedAt: inv.reviewedAt,
      purchaseOrder: {
        id: inv.purchaseOrder.id,
        reference: inv.purchaseOrder.reference,
        total: Number(inv.purchaseOrder.total),
      },
    }))
  )
})

// PUT /api/suppliers/[id]/invoices - Update supplier invoice status (admin)
export const PUT = withApiMiddleware(async (req, context) => {
  const { id } = await context.params
  const body = await req.json()
  const { invoiceId, status, reviewNotes } = body

  if (!invoiceId || !status) {
    return apiError('invoiceId et status requis', 400)
  }

  const validStatuses = ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID']
  if (!validStatuses.includes(status)) {
    return apiError('Statut invalide', 400)
  }

  const invoice = await prisma.supplierInvoice.findFirst({
    where: { id: invoiceId, supplierId: id },
  })

  if (!invoice) {
    return apiError('Facture introuvable', 404)
  }

  const updated = await prisma.supplierInvoice.update({
    where: { id: invoiceId },
    data: {
      status,
      reviewNotes: reviewNotes || null,
      reviewedAt: new Date(),
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'STATUS_CHANGE',
    entityType: 'supplierInvoice',
    entityId: invoiceId,
    metadata: { from: invoice.status, to: status, reference: invoice.reference },
  })

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    reviewNotes: updated.reviewNotes,
    reviewedAt: updated.reviewedAt,
  })
})
