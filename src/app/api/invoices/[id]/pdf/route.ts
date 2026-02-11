import { prisma } from '@/lib/db'
import { generateInvoicePDF } from '@/lib/pdf'
import { generateLegalMentions } from '@/lib/format'
import { withApiMiddleware, apiError } from '@/lib/api-middleware'

export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: { orderBy: { position: 'asc' } },
    },
  })

  if (!invoice) {
    return apiError('Facture introuvable', 404)
  }

  const settings = await prisma.companySettings.findFirst()

  const legalMentions = generateLegalMentions({
    latePenaltyRate: settings?.latePenaltyRate ? parseFloat(settings.latePenaltyRate.toString()) : null,
    earlyPaymentDiscount: settings?.earlyPaymentDiscount,
    defaultPaymentTerms: settings?.defaultPaymentTerms,
    companyName: settings?.companyName,
  })

  const pdfData = {
    reference: invoice.reference,
    status: invoice.status,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    clientPONumber: invoice.clientPONumber,
    situationNumber: invoice.situationNumber,
    situationTotal: invoice.situationTotal,
    subtotal: parseFloat(invoice.subtotal.toString()),
    taxAmount: parseFloat(invoice.taxAmount.toString()),
    discount: parseFloat(invoice.discount.toString()),
    total: parseFloat(invoice.total.toString()),
    amountPaid: parseFloat(invoice.amountPaid.toString()),
    amountDue: parseFloat(invoice.amountDue.toString()),
    notes: invoice.notes,
    terms: invoice.terms,
    client: {
      name: invoice.client.name,
      company: invoice.client.company,
      email: invoice.client.email,
      phone: invoice.client.phone,
      address: invoice.client.address,
    },
    items: invoice.items.map(item => ({
      description: item.description,
      section: item.section,
      quantity: parseFloat(item.quantity.toString()),
      unitPrice: parseFloat(item.unitPrice.toString()),
      discount: parseFloat(item.discount.toString()),
      taxRate: parseFloat(item.taxRate.toString()),
      total: parseFloat(item.total.toString()),
    })),
    legalMentions,
  }

  const company = {
    companyName: settings?.companyName || 'KWOT Finance',
    siret: settings?.siret,
    address: settings?.address,
    phone: settings?.phone,
    email: settings?.email,
    tvaIntracom: settings?.tvaIntracom,
    legalForm: settings?.legalForm,
    shareCapital: settings?.shareCapital,
    siren: settings?.siren,
    rcsNumber: settings?.rcsNumber,
    rcsCity: settings?.rcsCity,
    iban: settings?.iban,
    bic: settings?.bic,
  }

  const pdfBytes = generateInvoicePDF(pdfData, company)

  return new Response(pdfBytes.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.reference}.pdf"`,
    },
  }) as unknown as import('next/server').NextResponse
})
