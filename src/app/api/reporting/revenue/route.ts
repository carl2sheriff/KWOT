import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { InvoiceStatus } from '@prisma/client'

// Invoice statuses that count for revenue reporting
const REVENUE_STATUSES: InvoiceStatus[] = ['SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE']

// ============================================
// GET /api/reporting/revenue - Revenue breakdown
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year')
  const view = searchParams.get('view') || 'month'

  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  if (isNaN(year) || year < 2000 || year > 2100) {
    return apiError('Annee invalide', 400)
  }

  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  if (view === 'bu') {
    return await handleBuView(yearStart, yearEnd, year)
  } else if (view === 'seller') {
    return await handleSellerView(yearStart, yearEnd)
  } else if (view === 'month') {
    return await handleMonthView(year)
  } else {
    return apiError('Vue invalide. Utilisez: bu, seller, ou month', 400)
  }
})

// ============================================
// BU View: Revenue by business unit
// ============================================
async function handleBuView(yearStart: Date, yearEnd: Date, year: number) {
  // Sales BU: group invoices by salesBuId
  const invoicesWithSalesBu = await prisma.invoice.findMany({
    where: {
      issueDate: { gte: yearStart, lte: yearEnd },
      status: { in: REVENUE_STATUSES },
      salesBuId: { not: null },
    },
    include: {
      salesBu: { select: { id: true, name: true, code: true } },
    },
  })

  // Group by salesBuId
  const salesBuMap = new Map<string, {
    buId: string
    buName: string
    buCode: string
    invoiceCount: number
    totalHT: number
    totalTTC: number
  }>()

  for (const inv of invoicesWithSalesBu) {
    const buId = inv.salesBuId!
    const existing = salesBuMap.get(buId)
    if (existing) {
      existing.invoiceCount += 1
      existing.totalHT += Number(inv.subtotal)
      existing.totalTTC += Number(inv.total)
    } else {
      salesBuMap.set(buId, {
        buId,
        buName: inv.salesBu!.name,
        buCode: inv.salesBu!.code,
        invoiceCount: 1,
        totalHT: Number(inv.subtotal),
        totalTTC: Number(inv.total),
      })
    }
  }

  const salesBu = Array.from(salesBuMap.values()).map((b) => ({
    ...b,
    totalHT: Math.round(b.totalHT * 100) / 100,
    totalTTC: Math.round(b.totalTTC * 100) / 100,
  }))

  // Productive BU: group invoice items by productiveBuId
  const itemsWithProductiveBu = await prisma.invoiceItem.findMany({
    where: {
      productiveBuId: { not: null },
      invoice: {
        issueDate: { gte: yearStart, lte: yearEnd },
        status: { in: REVENUE_STATUSES },
      },
    },
    include: {
      productiveBu: { select: { id: true, name: true, code: true } },
    },
  })

  const productiveBuMap = new Map<string, {
    buId: string
    buName: string
    buCode: string
    itemCount: number
    totalHT: number
  }>()

  for (const item of itemsWithProductiveBu) {
    const buId = item.productiveBuId!
    const existing = productiveBuMap.get(buId)
    if (existing) {
      existing.itemCount += 1
      existing.totalHT += Number(item.total)
    } else {
      productiveBuMap.set(buId, {
        buId,
        buName: item.productiveBu!.name,
        buCode: item.productiveBu!.code,
        itemCount: 1,
        totalHT: Number(item.total),
      })
    }
  }

  const productiveBu = Array.from(productiveBuMap.values()).map((b) => ({
    ...b,
    totalHT: Math.round(b.totalHT * 100) / 100,
  }))

  // Also include invoices without a salesBu for completeness
  const unattributedSalesCount = await prisma.invoice.count({
    where: {
      issueDate: { gte: yearStart, lte: yearEnd },
      status: { in: REVENUE_STATUSES },
      salesBuId: null,
    },
  })

  const unattributedSalesSum = await prisma.invoice.aggregate({
    where: {
      issueDate: { gte: yearStart, lte: yearEnd },
      status: { in: REVENUE_STATUSES },
      salesBuId: null,
    },
    _sum: { subtotal: true, total: true },
  })

  const unattributedItemsCount = await prisma.invoiceItem.count({
    where: {
      productiveBuId: null,
      invoice: {
        issueDate: { gte: yearStart, lte: yearEnd },
        status: { in: REVENUE_STATUSES },
      },
    },
  })

  const unattributedItemsSum = await prisma.invoiceItem.aggregate({
    where: {
      productiveBuId: null,
      invoice: {
        issueDate: { gte: yearStart, lte: yearEnd },
        status: { in: REVENUE_STATUSES },
      },
    },
    _sum: { total: true },
  })

  return apiSuccess({
    year,
    salesBu,
    productiveBu,
    unattributed: {
      salesBu: {
        invoiceCount: unattributedSalesCount,
        totalHT: Math.round(Number(unattributedSalesSum._sum?.subtotal ?? 0) * 100) / 100,
        totalTTC: Math.round(Number(unattributedSalesSum._sum?.total ?? 0) * 100) / 100,
      },
      productiveBu: {
        itemCount: unattributedItemsCount,
        totalHT: Math.round(Number(unattributedItemsSum._sum?.total ?? 0) * 100) / 100,
      },
    },
  })
}

// ============================================
// Seller View: Revenue by seller
// ============================================
async function handleSellerView(yearStart: Date, yearEnd: Date) {
  const invoicesWithSeller = await prisma.invoice.findMany({
    where: {
      issueDate: { gte: yearStart, lte: yearEnd },
      status: { in: REVENUE_STATUSES },
      sellerId: { not: null },
    },
    include: {
      seller: { select: { id: true, name: true } },
    },
  })

  const sellerMap = new Map<string, {
    sellerId: string
    sellerName: string
    invoiceCount: number
    totalHT: number
    totalTTC: number
  }>()

  for (const inv of invoicesWithSeller) {
    const sid = inv.sellerId!
    const existing = sellerMap.get(sid)
    if (existing) {
      existing.invoiceCount += 1
      existing.totalHT += Number(inv.subtotal)
      existing.totalTTC += Number(inv.total)
    } else {
      sellerMap.set(sid, {
        sellerId: sid,
        sellerName: inv.seller!.name,
        invoiceCount: 1,
        totalHT: Number(inv.subtotal),
        totalTTC: Number(inv.total),
      })
    }
  }

  const sellers = Array.from(sellerMap.values()).map((s) => ({
    ...s,
    totalHT: Math.round(s.totalHT * 100) / 100,
    totalTTC: Math.round(s.totalTTC * 100) / 100,
  }))

  // Unattributed invoices
  const unattributedCount = await prisma.invoice.count({
    where: {
      issueDate: { gte: yearStart, lte: yearEnd },
      status: { in: REVENUE_STATUSES },
      sellerId: null,
    },
  })

  const unattributedSum = await prisma.invoice.aggregate({
    where: {
      issueDate: { gte: yearStart, lte: yearEnd },
      status: { in: REVENUE_STATUSES },
      sellerId: null,
    },
    _sum: { subtotal: true, total: true },
  })

  return apiSuccess({
    sellers,
    unattributed: {
      invoiceCount: unattributedCount,
      totalHT: Math.round(Number(unattributedSum._sum?.subtotal ?? 0) * 100) / 100,
      totalTTC: Math.round(Number(unattributedSum._sum?.total ?? 0) * 100) / 100,
    },
  })
}

// ============================================
// Month View: Revenue by month (allocated, invoiced, paid)
// ============================================
async function handleMonthView(year: number) {
  const months: {
    month: string
    allocated: number
    invoiced: number
    paid: number
  }[] = []

  for (let m = 0; m < 12; m++) {
    const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`
    const monthStart = new Date(year, m, 1)
    const monthEnd = new Date(year, m + 1, 0, 23, 59, 59, 999)

    // Allocated: sum of RevenueAllocation.amount for this month
    const allocatedResult = await prisma.revenueAllocation.aggregate({
      where: { month: monthStr },
      _sum: { amount: true },
    })

    // Invoiced: sum of invoice totals by issueDate month
    const invoicedResult = await prisma.invoice.aggregate({
      where: {
        issueDate: { gte: monthStart, lte: monthEnd },
        status: { in: REVENUE_STATUSES },
      },
      _sum: { total: true },
    })

    // Paid: sum of payments by paidAt month
    const paidResult = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    })

    months.push({
      month: monthStr,
      allocated: Math.round(Number(allocatedResult._sum?.amount ?? 0) * 100) / 100,
      invoiced: Math.round(Number(invoicedResult._sum?.total ?? 0) * 100) / 100,
      paid: Math.round(Number(paidResult._sum?.amount ?? 0) * 100) / 100,
    })
  }

  // ---- MSCV Yearly Aggregates ----
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  const revenueInvoicesYear = await prisma.invoice.findMany({
    where: {
      status: { in: REVENUE_STATUSES },
      issueDate: { gte: yearStart, lte: yearEnd },
      projectId: { not: null },
    },
    select: { projectId: true, total: true },
  })

  const projectRevenueMap = new Map<string, number>()
  for (const inv of revenueInvoicesYear) {
    if (!inv.projectId) continue
    projectRevenueMap.set(inv.projectId, (projectRevenueMap.get(inv.projectId) || 0) + Number(inv.total))
  }
  const mscvProjectIds = Array.from(projectRevenueMap.keys())
  const totalRevForMSCV = Array.from(projectRevenueMap.values()).reduce((a, b) => a + b, 0)

  let mscvQuoted = 0, mscvBudget = 0, mscvTimeCost = 0, mscvExpenseCost = 0, mscvPoCost = 0

  if (mscvProjectIds.length > 0) {
    const [projectsData, poResult, expResult, timeEntries] = await Promise.all([
      prisma.project.findMany({
        where: { id: { in: mscvProjectIds } },
        select: {
          budget: true,
          quotes: { where: { status: { in: ['APPROVED', 'SENT'] } }, select: { total: true } },
        },
      }),
      prisma.purchaseOrder.aggregate({
        where: { projectId: { in: mscvProjectIds }, status: { in: ['CONFIRMED', 'RECEIVED'] } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { projectId: { in: mscvProjectIds } },
        _sum: { amount: true },
      }),
      prisma.timeEntry.findMany({
        where: { projectId: { in: mscvProjectIds } },
        select: { duration: true, hourlyRate: true, user: { select: { hourlyRate: true } } },
      }),
    ])

    for (const p of projectsData) {
      mscvBudget += p.budget ? Number(p.budget) : 0
      mscvQuoted += p.quotes.reduce((s, q) => s + Number(q.total), 0)
    }
    mscvPoCost = Number(poResult._sum.total ?? 0)
    mscvExpenseCost = Number(expResult._sum.amount ?? 0)
    for (const te of timeEntries) {
      const hours = (te.duration || 0) / 60
      const rate = te.hourlyRate ? Number(te.hourlyRate) : (te.user.hourlyRate ? Number(te.user.hourlyRate) : 0)
      mscvTimeCost += hours * rate
    }
  }

  const r = (n: number) => Math.round(n * 100) / 100
  const mscvPrev = mscvQuoted - mscvBudget
  const mscvProv = totalRevForMSCV - (mscvTimeCost + mscvExpenseCost)
  const mscvDef = totalRevForMSCV - mscvPoCost

  return apiSuccess({
    year,
    months,
    mscv: {
      previsionnelle: r(mscvPrev),
      previsionnelleRate: r(mscvQuoted > 0 ? (mscvPrev / mscvQuoted) * 100 : 0),
      provisoire: r(mscvProv),
      provisoireRate: r(totalRevForMSCV > 0 ? (mscvProv / totalRevForMSCV) * 100 : 0),
      definitive: r(mscvDef),
      definitiveRate: r(totalRevForMSCV > 0 ? (mscvDef / totalRevForMSCV) * 100 : 0),
    },
  })
}
