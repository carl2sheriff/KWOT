import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { generateReference } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// POST /api/quotes/[id]/convert - Convert approved quote to invoice
export const POST = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const existing = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: { orderBy: { position: 'asc' } },
      invoices: true,
    },
  })

  if (!existing) {
    return apiError('Devis non trouve', 404)
  }

  if (existing.status !== 'APPROVED') {
    return apiError('Seuls les devis approuves peuvent etre convertis en facture', 400)
  }

  if (existing.invoices.length > 0) {
    return apiError('Ce devis a deja ete converti en facture', 400)
  }

  // Get company settings for payment terms
  const settings = await prisma.companySettings.findFirst()
  const paymentTerms = settings?.defaultPaymentTerms ?? 30

  // Auto-populate salesBuId from the project's buId if available
  let salesBuId: string | null = null
  if (existing.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: existing.projectId },
      select: { buId: true },
    })
    if (project?.buId) {
      salesBuId = project.buId
    }
  }

  // Generate invoice reference
  const invoiceReference = await generateReference('invoice')

  // Calculate due date
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + paymentTerms)

  // Create invoice in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        reference: invoiceReference,
        quoteId: id,
        clientId: existing.clientId,
        projectId: existing.projectId,
        createdById: TEMP_USER_ID,
        salesBuId,
        status: 'DRAFT',
        dueDate,
        subtotal: existing.subtotal,
        taxRate: existing.taxRate,
        taxAmount: existing.taxAmount,
        discount: existing.discount,
        total: existing.total,
        amountPaid: 0,
        amountDue: existing.total,
        notes: existing.notes,
        terms: existing.terms,
        items: {
          create: existing.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            total: item.total,
            position: item.position,
          })),
        },
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        items: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return created
  })

  // Create audit logs
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'invoice',
    entityId: invoice.id,
    metadata: {
      reference: invoice.reference,
      convertedFrom: existing.reference,
      quoteId: id,
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'STATUS_CHANGE',
    entityType: 'quote',
    entityId: id,
    changes: { convertedToInvoice: { from: null, to: invoice.reference } },
    metadata: { invoiceId: invoice.id },
  })

  return apiSuccess(invoice)
})
