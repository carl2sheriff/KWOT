import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/extranet/invoices/[id]/download?token=xxx - Download uploaded invoice PDF
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return Response.json({ success: false, error: 'Token requis' }, { status: 400 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { accessToken: token },
      select: { id: true, accessTokenExpiresAt: true },
    })

    if (!supplier) {
      return Response.json({ success: false, error: 'Token invalide' }, { status: 401 })
    }

    if (supplier.accessTokenExpiresAt && supplier.accessTokenExpiresAt < new Date()) {
      return Response.json({ success: false, error: 'Token expire' }, { status: 401 })
    }

    const invoice = await prisma.supplierInvoice.findFirst({
      where: { id, supplierId: supplier.id },
    })

    if (!invoice) {
      return Response.json({ success: false, error: 'Facture introuvable' }, { status: 404 })
    }

    return new Response(invoice.fileData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.fileName}"`,
      },
    })
  } catch {
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
