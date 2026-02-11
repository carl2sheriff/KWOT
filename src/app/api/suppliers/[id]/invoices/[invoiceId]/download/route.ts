import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/suppliers/[id]/invoices/[invoiceId]/download - Download supplier invoice (admin)
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string; invoiceId: string }> }) {
  try {
    const { id, invoiceId } = await context.params

    const invoice = await prisma.supplierInvoice.findFirst({
      where: { id: invoiceId, supplierId: id },
    })

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Facture introuvable' }, { status: 404 })
    }

    return new NextResponse(Buffer.from(invoice.fileData), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.fileName}"`,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
