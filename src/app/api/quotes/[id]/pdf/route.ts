import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateQuotePDF } from '@/lib/pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: { orderBy: { position: 'asc' } },
      },
    })

    if (!quote) {
      return new Response('Devis non trouve', { status: 404 })
    }

    const settings = await prisma.companySettings.findFirst()

    const pdfData = {
      reference: quote.reference,
      status: quote.status,
      createdAt: quote.createdAt.toISOString(),
      validUntil: quote.validUntil?.toISOString() || null,
      clientPONumber: quote.clientPONumber,
      subtotal: parseFloat(quote.subtotal.toString()),
      taxAmount: parseFloat(quote.taxAmount.toString()),
      discount: parseFloat(quote.discount.toString()),
      discountType: quote.discountType,
      total: parseFloat(quote.total.toString()),
      notes: quote.notes,
      terms: quote.terms,
      client: {
        name: quote.client.name,
        company: quote.client.company,
        email: quote.client.email,
        phone: quote.client.phone,
        address: quote.client.address,
      },
      items: quote.items.map(item => ({
        description: item.description,
        section: item.section,
        quantity: parseFloat(item.quantity.toString()),
        unitPrice: parseFloat(item.unitPrice.toString()),
        discount: parseFloat(item.discount.toString()),
        taxRate: parseFloat(item.taxRate.toString()),
        total: parseFloat(item.total.toString()),
      })),
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

    const pdfBytes = generateQuotePDF(pdfData, company)

    return new Response(pdfBytes.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.reference}.pdf"`,
      },
    })
  } catch (error) {
    console.error('GET /api/quotes/[id]/pdf error:', error)
    return new Response('Erreur generation PDF', { status: 500 })
  }
}
