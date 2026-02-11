import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePurchaseOrderPDF } from '@/lib/pdf'

// GET /api/extranet/purchase-orders/[id]/pdf?token=xxx - Download PO PDF
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

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, supplierId: supplier.id },
      include: {
        supplier: true,
        project: { select: { id: true, name: true } },
        items: { orderBy: { position: 'asc' } },
      },
    })

    if (!po) {
      return Response.json({ success: false, error: 'Bon de commande introuvable' }, { status: 404 })
    }

    const settings = await prisma.companySettings.findFirst()

    const pdfBytes = generatePurchaseOrderPDF(
      {
        reference: po.reference,
        status: po.status,
        orderDate: po.orderDate.toISOString(),
        expectedDelivery: po.expectedDelivery?.toISOString() ?? null,
        subtotal: Number(po.subtotal),
        taxRate: Number(po.taxRate),
        taxAmount: Number(po.taxAmount),
        total: Number(po.total),
        notes: po.notes,
        supplier: {
          name: po.supplier.name,
          company: po.supplier.company,
          email: po.supplier.email,
          address: po.supplier.address,
        },
        project: po.project,
        items: po.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      },
      {
        companyName: settings?.companyName ?? 'Sheriff Projects',
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
      }
    )

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${po.reference}.pdf"`,
      },
    })
  } catch {
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
