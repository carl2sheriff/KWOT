import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/extranet/purchase-orders?token=xxx - List POs for supplier
export async function GET(req: NextRequest) {
  try {
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

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: supplier.id,
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
      },
      include: {
        project: { select: { id: true, name: true } },
        items: { orderBy: { position: 'asc' } },
        supplierInvoices: {
          select: { id: true, reference: true, status: true, amount: true, submittedAt: true, fileName: true },
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({
      success: true,
      data: purchaseOrders.map(po => ({
        ...po,
        subtotal: Number(po.subtotal),
        taxRate: Number(po.taxRate),
        taxAmount: Number(po.taxAmount),
        total: Number(po.total),
        items: po.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        supplierInvoices: po.supplierInvoices.map(inv => ({
          ...inv,
          amount: inv.amount ? Number(inv.amount) : null,
        })),
      })),
    })
  } catch {
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
