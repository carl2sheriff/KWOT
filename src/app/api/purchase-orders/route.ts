import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createPurchaseOrderSchema } from '@/lib/schemas'
import { generateReference, calculateTotals, calculateItemTotal } from '@/lib/numbering'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/purchase-orders - List purchase orders
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const supplierId = searchParams.get('supplierId') || ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
      { supplier: { company: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (supplierId) {
    where.supplierId = supplierId
  }

  const [purchaseOrders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.purchaseOrder.count({ where }),
  ])

  return apiSuccess(purchaseOrders, buildPagination(page, limit, total))
})

// ============================================
// POST /api/purchase-orders - Create purchase order
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const validation = createPurchaseOrderSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Generate reference
  const reference = await generateReference('purchaseOrder')

  // Calculate totals
  const totals = calculateTotals(
    data.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: 0,
    })),
    data.taxRate,
    0,
    'PERCENTAGE'
  )

  // Create PO with items in transaction
  const purchaseOrder = await prisma.$transaction(async (tx) => {
    const created = await tx.purchaseOrder.create({
      data: {
        reference,
        supplierId: data.supplierId,
        projectId: data.projectId || null,
        createdById: TEMP_USER_ID,
        status: 'DRAFT',
        expectedDelivery: data.expectedDelivery || null,
        subtotal: totals.subtotal,
        taxRate: data.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes: data.notes || null,
        items: {
          create: data.items.map((item, index) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: calculateItemTotal(item.quantity, item.unitPrice, 0),
            position: index + 1,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    })

    return created
  })

  // Create audit log
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'purchaseOrder',
    entityId: purchaseOrder.id,
    metadata: { reference: purchaseOrder.reference },
  })

  return apiSuccess(purchaseOrder)
})
