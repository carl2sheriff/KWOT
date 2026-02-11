import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { generateQuotePDF } from '@/lib/pdf'
import { sendEmail, buildQuoteEmailHTML } from '@/lib/email'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// POST /api/quotes/[id]/send - Mark quote as SENT and send email
export const POST = withApiMiddleware(async (
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
    return apiError('Seuls les devis en brouillon peuvent etre envoyes', 400)
  }

  // Update status to SENT
  const quote = await prisma.quote.update({
    where: { id },
    data: { status: 'SENT' },
    include: {
      client: {
        select: { id: true, name: true, company: true, email: true, address: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
      items: {
        orderBy: { position: 'asc' },
      },
    },
  })

  // Attempt PDF generation and email sending (graceful degradation)
  let emailSent = false

  try {
    // Get company settings for PDF and email
    const company = await prisma.companySettings.findFirst()

    if (company && quote.client.email) {
      // Map Prisma data to PDF data format (Decimal -> number, Date -> string)
      const pdfData = {
        reference: quote.reference,
        status: quote.status,
        createdAt: quote.createdAt.toISOString(),
        validUntil: quote.validUntil?.toISOString() ?? null,
        clientPONumber: quote.clientPONumber,
        subtotal: Number(quote.subtotal),
        taxAmount: Number(quote.taxAmount),
        discount: Number(quote.discount),
        discountType: quote.discountType,
        total: Number(quote.total),
        notes: quote.notes,
        terms: quote.terms,
        client: {
          name: quote.client.name,
          company: quote.client.company,
          email: quote.client.email,
          address: quote.client.address,
        },
        items: quote.items.map(item => ({
          description: item.description,
          section: item.section,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          taxRate: Number(item.taxRate),
          total: Number(item.total),
        })),
      }

      // Generate PDF
      const pdfBuffer = generateQuotePDF(pdfData, company)

      // Build email HTML
      const html = buildQuoteEmailHTML({
        companyName: company.companyName,
        reference: quote.reference,
        clientName: quote.client.name,
        total: Number(quote.total),
        validUntil: quote.validUntil?.toISOString() ?? null,
      })

      // Send email with PDF attached
      emailSent = await sendEmail({
        to: quote.client.email,
        subject: `Devis ${quote.reference} - ${company.companyName}`,
        html,
        attachments: [
          {
            filename: `${quote.reference}.pdf`,
            content: Buffer.from(pdfBuffer),
          },
        ],
      })
    } else if (!quote.client.email) {
      console.warn(`[QUOTE SEND] Client ${quote.client.name} n'a pas d'adresse email`)
    }
  } catch (error) {
    console.error('[QUOTE SEND] Erreur PDF/email (status mis a jour malgre tout):', error)
  }

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'STATUS_CHANGE',
    entityType: 'quote',
    entityId: id,
    changes: { status: { from: 'DRAFT', to: 'SENT' } },
    metadata: { reference: quote.reference, emailSent },
  })

  return apiSuccess(quote)
})
