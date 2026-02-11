import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['application/pdf']

// GET /api/extranet/invoices?token=xxx - List supplier's invoices
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

    const invoices = await prisma.supplierInvoice.findMany({
      where: { supplierId: supplier.id },
      include: {
        purchaseOrder: { select: { id: true, reference: true, total: true } },
      },
      orderBy: { submittedAt: 'desc' },
    })

    return Response.json({
      success: true,
      data: invoices.map(inv => ({
        id: inv.id,
        reference: inv.reference,
        fileName: inv.fileName,
        fileSize: inv.fileSize,
        amount: inv.amount ? Number(inv.amount) : null,
        status: inv.status,
        notes: inv.notes,
        reviewNotes: inv.reviewNotes,
        submittedAt: inv.submittedAt,
        reviewedAt: inv.reviewedAt,
        purchaseOrder: {
          id: inv.purchaseOrder.id,
          reference: inv.purchaseOrder.reference,
          total: Number(inv.purchaseOrder.total),
        },
      })),
    })
  } catch {
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/extranet/invoices - Upload supplier invoice
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const token = formData.get('token') as string
    const purchaseOrderId = formData.get('purchaseOrderId') as string
    const reference = formData.get('reference') as string
    const amount = formData.get('amount') as string
    const notes = formData.get('notes') as string
    const file = formData.get('file') as File

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

    if (!purchaseOrderId || !reference || !file) {
      return Response.json({ success: false, error: 'Champs requis: purchaseOrderId, reference, file' }, { status: 400 })
    }

    // Verify PO belongs to this supplier
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, supplierId: supplier.id },
    })

    if (!po) {
      return Response.json({ success: false, error: 'Bon de commande introuvable' }, { status: 404 })
    }

    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ success: false, error: 'Seuls les fichiers PDF sont acceptes' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ success: false, error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })
    }

    // Validate PDF magic bytes
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      return Response.json({ success: false, error: 'Le fichier n\'est pas un PDF valide' }, { status: 400 })
    }

    const invoice = await prisma.supplierInvoice.create({
      data: {
        supplierId: supplier.id,
        purchaseOrderId,
        reference: reference.trim(),
        fileName: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        fileData: Buffer.from(arrayBuffer),
        fileSize: file.size,
        amount: amount ? parseFloat(amount) : null,
        notes: notes || null,
      },
      include: {
        purchaseOrder: { select: { id: true, reference: true } },
      },
    })

    return Response.json({
      success: true,
      data: {
        id: invoice.id,
        reference: invoice.reference,
        fileName: invoice.fileName,
        fileSize: invoice.fileSize,
        amount: invoice.amount ? Number(invoice.amount) : null,
        status: invoice.status,
        submittedAt: invoice.submittedAt,
        purchaseOrder: invoice.purchaseOrder,
      },
    })
  } catch {
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
