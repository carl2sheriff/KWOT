import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { generateReference, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// POST /api/quotes/[id]/situation - Create a situation invoice from a milestone
export const POST = withApiMiddleware(async (
  req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const body = await req.json()
  const { milestoneId } = body

  if (!milestoneId || typeof milestoneId !== 'string') {
    return apiError('milestoneId requis', 400)
  }

  // Find the quote with items and milestones
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: { orderBy: { position: 'asc' } },
      milestones: { orderBy: { position: 'asc' } },
    },
  })

  if (!quote) {
    return apiError('Devis non trouve', 404)
  }

  if (quote.status !== 'APPROVED') {
    return apiError('Seuls les devis approuves peuvent generer des factures de situation', 400)
  }

  // Find the specific milestone
  const milestone = quote.milestones.find(m => m.id === milestoneId)

  if (!milestone) {
    return apiError('Echeance non trouvee sur ce devis', 404)
  }

  if (milestone.invoiceId) {
    return apiError('Cette echeance a deja ete facturee', 400)
  }

  // Calculate milestone percentage as a number
  const percentage = Number(milestone.percentage)

  // Calculate proportional amounts
  const quoteSubtotal = Number(quote.subtotal)
  const quoteTaxAmount = Number(quote.taxAmount)
  const quoteTotal = Number(quote.total)
  const quoteDiscount = Number(quote.discount)

  const subtotal = Math.round(quoteSubtotal * (percentage / 100) * 100) / 100
  const taxAmount = Math.round(quoteTaxAmount * (percentage / 100) * 100) / 100
  const total = Math.round(quoteTotal * (percentage / 100) * 100) / 100
  const discount = Math.round(quoteDiscount * (percentage / 100) * 100) / 100

  // Determine situation numbering
  const invoicedMilestonesCount = quote.milestones.filter(m => m.invoiceId !== null).length
  const situationNumber = invoicedMilestonesCount + 1
  const situationTotal = quote.milestones.length

  // Generate invoice reference
  const invoiceReference = await generateReference('invoice')

  // Get company settings for payment terms
  const settings = await prisma.companySettings.findFirst()
  const paymentTerms = settings?.defaultPaymentTerms ?? 30

  // Calculate due date
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + paymentTerms)

  // Create invoice in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        reference: invoiceReference,
        quoteId: id,
        clientId: quote.clientId,
        projectId: quote.projectId,
        createdById: TEMP_USER_ID,
        status: 'DRAFT',
        situationNumber,
        situationTotal,
        dueDate,
        subtotal,
        taxRate: quote.taxRate,
        taxAmount,
        discount,
        total,
        amountPaid: 0,
        amountDue: total,
        clientPONumber: quote.clientPONumber,
        notes: `Facture de situation ${situationNumber}/${situationTotal} - ${milestone.label}`,
        terms: quote.terms,
        items: {
          create: quote.items.map((item) => {
            const itemQuantity = Number(item.quantity)
            const itemUnitPrice = Number(item.unitPrice)
            const itemDiscount = Number(item.discount)

            // Scale the item proportionally
            const scaledQuantity = Math.round(itemQuantity * (percentage / 100) * 100) / 100
            const scaledDiscount = Math.round(itemDiscount * (percentage / 100) * 100) / 100
            const scaledTotal = calculateItemTotal(scaledQuantity, itemUnitPrice, scaledDiscount)

            return {
              productId: item.productId,
              description: item.description,
              quantity: scaledQuantity,
              unitPrice: item.unitPrice,
              discount: scaledDiscount,
              taxRate: item.taxRate,
              total: scaledTotal,
              position: item.position,
            }
          }),
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

    // Link the milestone to the new invoice
    await tx.quoteMilestone.update({
      where: { id: milestoneId },
      data: { invoiceId: created.id },
    })

    return created
  })

  // Create audit log
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'invoice',
    entityId: invoice.id,
    metadata: {
      reference: invoice.reference,
      type: 'situation',
      situationNumber,
      situationTotal,
      milestoneId,
      milestoneLabel: milestone.label,
      percentage,
      quoteId: id,
      quoteReference: quote.reference,
    },
  })

  return apiSuccess(invoice)
})
