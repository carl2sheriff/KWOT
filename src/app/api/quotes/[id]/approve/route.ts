import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// POST /api/quotes/[id]/approve - Approve or reject quote
export const POST = withApiMiddleware(async (
  req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const body = await req.json()
  const { action } = body as { action?: string }

  if (!action || !['approve', 'reject'].includes(action)) {
    return apiError('Action invalide. Utilisez "approve" ou "reject"', 400)
  }

  const existing = await prisma.quote.findUnique({ where: { id } })

  if (!existing) {
    return apiError('Devis non trouve', 404)
  }

  if (existing.status !== 'SENT') {
    return apiError('Seuls les devis envoyes peuvent etre approuves ou refuses', 400)
  }

  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

  const quote = await prisma.quote.update({
    where: { id },
    data: { status: newStatus },
    include: {
      client: {
        select: { id: true, name: true, company: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: action === 'approve' ? 'APPROVE' : 'REJECT',
    entityType: 'quote',
    entityId: id,
    changes: { status: { from: 'SENT', to: newStatus } },
    metadata: { reference: quote.reference },
  })

  return apiSuccess(quote)
})
