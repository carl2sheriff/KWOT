import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { generateInvoicePDF } from '@/lib/pdf'
import { sendEmail, buildInvoiceEmailHTML } from '@/lib/email'
import { generateLegalMentions } from '@/lib/format'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// POST /api/invoices/[id]/send - Mark as SENT and send email
// ============================================
export const POST = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, status: true, reference: true },
  })

  if (!existing) {
    return apiError('Facture introuvable', 404)
  }

  if (existing.status !== 'DRAFT') {
    return apiError('Seule une facture en brouillon peut etre envoyee', 400)
  }

  // Update status to SENT
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: 'SENT' },
    include: {
      client: { select: { id: true, name: true, company: true, email: true, address: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        orderBy: { position: 'asc' },
      },
    },
  })

  // Attempt PDF generation and email sending (graceful degradation)
  let emailSent = false

  try {
    // Get company settings for PDF, email, and legal mentions
    const company = await prisma.companySettings.findFirst()

    if (company && invoice.client.email) {
      // Generate legal mentions for the invoice PDF
      const legalMentions = generateLegalMentions({
        latePenaltyRate: company.latePenaltyRate ? Number(company.latePenaltyRate) : null,
        earlyPaymentDiscount: company.earlyPaymentDiscount,
        defaultPaymentTerms: company.defaultPaymentTerms,
        legalForm: company.legalForm,
        shareCapital: company.shareCapital,
        siren: company.siren,
        rcsNumber: company.rcsNumber,
        rcsCity: company.rcsCity,
        tvaIntracom: company.tvaIntracom,
        companyName: company.companyName,
      })

      // Map Prisma data to PDF data format (Decimal -> number, Date -> string)
      const pdfData = {
        reference: invoice.reference,
        status: invoice.status,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        clientPONumber: invoice.clientPONumber,
        situationNumber: invoice.situationNumber,
        situationTotal: invoice.situationTotal,
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        discount: Number(invoice.discount),
        total: Number(invoice.total),
        amountPaid: Number(invoice.amountPaid),
        amountDue: Number(invoice.amountDue),
        notes: invoice.notes,
        terms: invoice.terms,
        client: {
          name: invoice.client.name,
          company: invoice.client.company,
          email: invoice.client.email,
          address: invoice.client.address,
        },
        items: invoice.items.map(item => ({
          description: item.description,
          section: item.section,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          taxRate: Number(item.taxRate),
          total: Number(item.total),
        })),
        legalMentions,
      }

      // Generate PDF with legal mentions included in data
      const pdfBuffer = generateInvoicePDF(pdfData, company)

      // Build email HTML
      const html = buildInvoiceEmailHTML({
        companyName: company.companyName,
        reference: invoice.reference,
        clientName: invoice.client.name,
        total: Number(invoice.total),
        dueDate: invoice.dueDate.toISOString(),
        amountDue: Number(invoice.amountDue),
      })

      // Send email with PDF attached
      emailSent = await sendEmail({
        to: invoice.client.email,
        subject: `Facture ${invoice.reference} - ${company.companyName}`,
        html,
        attachments: [
          {
            filename: `${invoice.reference}.pdf`,
            content: Buffer.from(pdfBuffer),
          },
        ],
      })
    } else if (!invoice.client.email) {
      console.warn(`[INVOICE SEND] Client ${invoice.client.name} n'a pas d'adresse email`)
    }
  } catch (error) {
    console.error('[INVOICE SEND] Erreur PDF/email (status mis a jour malgre tout):', error)
  }

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'SEND',
    entityType: 'invoice',
    entityId: id,
    changes: { status: { from: 'DRAFT', to: 'SENT' } },
    metadata: { reference: existing.reference, emailSent },
  })

  return apiSuccess(invoice)
})
