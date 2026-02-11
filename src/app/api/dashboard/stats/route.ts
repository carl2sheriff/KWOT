import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess } from '@/lib/api-middleware'

// ============================================
// GET /api/dashboard/stats - Financial dashboard statistics
// ============================================
export const GET = withApiMiddleware(async () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // ---- Revenue MTD & YTD ----
  const [revenueMTDResult, revenueYTDResult] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        paidAt: { gte: startOfMonth },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        paidAt: { gte: startOfYear },
      },
    }),
  ])

  const revenueMTD = Number(revenueMTDResult._sum.amount ?? 0)
  const revenueYTD = Number(revenueYTDResult._sum.amount ?? 0)

  // ---- Outstanding invoices (SENT or PARTIALLY_PAID) ----
  const [outstandingResult, outstandingAmountResult] = await Promise.all([
    prisma.invoice.count({
      where: { status: { in: ['SENT', 'PARTIALLY_PAID'] } },
    }),
    prisma.invoice.aggregate({
      _sum: { amountDue: true },
      where: { status: { in: ['SENT', 'PARTIALLY_PAID'] } },
    }),
  ])

  const outstandingInvoices = outstandingResult
  const outstandingAmount = Number(outstandingAmountResult._sum.amountDue ?? 0)

  // ---- Overdue invoices ----
  const [overdueCountResult, overdueAmountResult] = await Promise.all([
    prisma.invoice.count({
      where: { status: 'OVERDUE' },
    }),
    prisma.invoice.aggregate({
      _sum: { amountDue: true },
      where: { status: 'OVERDUE' },
    }),
  ])

  const overdueCount = overdueCountResult
  const overdueAmount = Number(overdueAmountResult._sum.amountDue ?? 0)

  // ---- Pending quotes (SENT) ----
  const [pendingQuotesCount, pendingQuotesAmountResult] = await Promise.all([
    prisma.quote.count({
      where: { status: 'SENT' },
    }),
    prisma.quote.aggregate({
      _sum: { total: true },
      where: { status: 'SENT' },
    }),
  ])

  const pendingQuotes = pendingQuotesCount
  const pendingQuotesAmount = Number(pendingQuotesAmountResult._sum.total ?? 0)

  // ---- Conversion rate: approved / total non-draft quotes * 100 ----
  const [approvedCount, totalNonDraftCount] = await Promise.all([
    prisma.quote.count({
      where: { status: 'APPROVED' },
    }),
    prisma.quote.count({
      where: { status: { not: 'DRAFT' } },
    }),
  ])

  const conversionRate = totalNonDraftCount > 0
    ? Math.round((approvedCount / totalNonDraftCount) * 10000) / 100
    : 0

  // ---- Recent payments (last 5) ----
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      invoice: {
        select: {
          reference: true,
          client: {
            select: { id: true, name: true, company: true },
          },
        },
      },
    },
  })

  // ---- Recent quotes (last 5) ----
  const recentQuotes = await prisma.quote.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: { id: true, name: true, company: true },
      },
    },
  })

  // ---- Monthly revenue (last 6 months) ----
  const monthlyRevenue: { month: string; amount: number }[] = []
  const monthNames = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC']

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)

    const monthResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        paidAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    })

    monthlyRevenue.push({
      month: monthNames[monthStart.getMonth()],
      amount: Number(monthResult._sum.amount ?? 0),
    })
  }

  // ---- Invoices by status (for donut chart) ----
  const invoicesByStatusRaw = await prisma.invoice.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { total: true },
  })

  const invoicesByStatus = invoicesByStatusRaw.map((row) => ({
    status: row.status,
    count: row._count.id,
    amount: Number(row._sum.total ?? 0),
  }))

  // ---- MSCV YTD (3 phases) ----
  const revenueInvoicesYTD = await prisma.invoice.findMany({
    where: {
      status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] },
      issueDate: { gte: startOfYear },
      projectId: { not: null },
    },
    select: { projectId: true, total: true },
  })

  const projectRevenueMap = new Map<string, number>()
  for (const inv of revenueInvoicesYTD) {
    if (!inv.projectId) continue
    projectRevenueMap.set(inv.projectId, (projectRevenueMap.get(inv.projectId) || 0) + Number(inv.total))
  }
  const mscvProjectIds = Array.from(projectRevenueMap.keys())
  const totalRevenueYTDForMSCV = Array.from(projectRevenueMap.values()).reduce((a, b) => a + b, 0)

  let mscvQuotedAmountYTD = 0
  let mscvBudgetYTD = 0
  let mscvTimeCostYTD = 0
  let mscvExpenseCostYTD = 0
  let mscvPoCostYTD = 0

  if (mscvProjectIds.length > 0) {
    const [projectsData, poResult, expenseResult, timeEntries] = await Promise.all([
      prisma.project.findMany({
        where: { id: { in: mscvProjectIds } },
        select: {
          id: true,
          budget: true,
          quotes: {
            where: { status: { in: ['APPROVED', 'SENT'] } },
            select: { total: true },
          },
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
      mscvBudgetYTD += p.budget ? Number(p.budget) : 0
      mscvQuotedAmountYTD += p.quotes.reduce((s, q) => s + Number(q.total), 0)
    }

    mscvPoCostYTD = Number(poResult._sum.total ?? 0)
    mscvExpenseCostYTD = Number(expenseResult._sum.amount ?? 0)

    for (const te of timeEntries) {
      const hours = (te.duration || 0) / 60
      const rate = te.hourlyRate ? Number(te.hourlyRate) : (te.user.hourlyRate ? Number(te.user.hourlyRate) : 0)
      mscvTimeCostYTD += hours * rate
    }
  }

  const r = (n: number) => Math.round(n * 100) / 100
  const mscvPrevisionnelleYTD = mscvQuotedAmountYTD - mscvBudgetYTD
  const mscvProvisoireYTD = totalRevenueYTDForMSCV - (mscvTimeCostYTD + mscvExpenseCostYTD)
  const mscvDefinitiveYTD = totalRevenueYTDForMSCV - mscvPoCostYTD

  return apiSuccess({
    revenueMTD,
    revenueYTD,
    outstandingInvoices,
    outstandingAmount,
    overdueAmount,
    overdueCount,
    pendingQuotes,
    pendingQuotesAmount,
    conversionRate,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      invoiceReference: p.invoice.reference,
      clientName: p.invoice.client.name,
      clientCompany: p.invoice.client.company,
    })),
    recentQuotes: recentQuotes.map((q) => ({
      id: q.id,
      reference: q.reference,
      status: q.status,
      total: Number(q.total),
      createdAt: q.createdAt,
      clientName: q.client.name,
      clientCompany: q.client.company,
    })),
    monthlyRevenue,
    invoicesByStatus,
    // MSCV YTD
    mscvPrevisionnelleYTD: r(mscvPrevisionnelleYTD),
    mscvPrevisionnelleRateYTD: r(mscvQuotedAmountYTD > 0 ? (mscvPrevisionnelleYTD / mscvQuotedAmountYTD) * 100 : 0),
    mscvProvisoireYTD: r(mscvProvisoireYTD),
    mscvProvisoireRateYTD: r(totalRevenueYTDForMSCV > 0 ? (mscvProvisoireYTD / totalRevenueYTDForMSCV) * 100 : 0),
    mscvDefinitiveYTD: r(mscvDefinitiveYTD),
    mscvDefinitiveRateYTD: r(totalRevenueYTDForMSCV > 0 ? (mscvDefinitiveYTD / totalRevenueYTDForMSCV) * 100 : 0),
  })
})
