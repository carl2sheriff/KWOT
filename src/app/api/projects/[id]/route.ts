import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { createAuditLog, diffChanges } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// ============================================
// GET /api/projects/[id] - Get project with financial summary
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true } },
      owner: { select: { id: true, name: true } },
      _count: {
        select: {
          tasks: true,
          quotes: true,
          invoices: true,
          purchaseOrders: true,
        },
      },
      invoices: {
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
          amountPaid: true,
          amountDue: true,
        },
      },
      quotes: {
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
        },
      },
      purchaseOrders: {
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
        },
      },
    },
  })

  if (!project) {
    return apiError('Projet non trouve', 404)
  }

  // Calculate financial summary
  const revenueStatuses = ['SENT', 'PAID', 'PARTIALLY_PAID']
  const costStatuses = ['CONFIRMED', 'RECEIVED']
  const quotedStatuses = ['APPROVED', 'SENT']
  const outstandingStatuses = ['SENT', 'PARTIALLY_PAID', 'OVERDUE']

  const revenue = project.invoices
    .filter((inv) => revenueStatuses.includes(inv.status))
    .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)

  const costs = project.purchaseOrders
    .filter((po) => costStatuses.includes(po.status))
    .reduce((sum, po) => sum + parseFloat(po.total.toString()), 0)

  const margin = revenue - costs
  const marginRate = revenue > 0 ? (margin / revenue) * 100 : 0

  const quotedAmount = project.quotes
    .filter((q) => quotedStatuses.includes(q.status))
    .reduce((sum, q) => sum + parseFloat(q.total.toString()), 0)

  const paidAmount = project.invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amountPaid.toString()),
    0
  )

  const outstandingAmount = project.invoices
    .filter((inv) => outstandingStatuses.includes(inv.status))
    .reduce((sum, inv) => sum + parseFloat(inv.amountDue.toString()), 0)

  // Time tracking & expenses profitability
  const [timeAgg, expenseAgg, billableTimeAgg] = await Promise.all([
    prisma.timeEntry.aggregate({
      where: { projectId: id },
      _sum: { duration: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { projectId: id },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.timeEntry.aggregate({
      where: { projectId: id, billable: true },
      _sum: { duration: true },
    }),
  ])

  // Get all time entries with user info for per-person breakdown
  const timeEntriesWithUsers = await prisma.timeEntry.findMany({
    where: { projectId: id },
    select: {
      duration: true,
      hourlyRate: true,
      billable: true,
      user: { select: { id: true, name: true } },
    },
  })

  // Calculate time cost
  const timeCost = timeEntriesWithUsers
    .filter(te => te.hourlyRate !== null)
    .reduce((sum, te) => {
      const hours = (te.duration || 0) / 60
      const rate = te.hourlyRate ? parseFloat(te.hourlyRate.toString()) : 0
      return sum + hours * rate
    }, 0)

  // Build per-user breakdown
  const userTimeMap = new Map<string, { id: string; name: string; totalMinutes: number; billableMinutes: number; totalCost: number; rate: number; entries: number }>()
  for (const te of timeEntriesWithUsers) {
    const uid = te.user.id
    const existing = userTimeMap.get(uid) || { id: uid, name: te.user.name, totalMinutes: 0, billableMinutes: 0, totalCost: 0, rate: 0, entries: 0 }
    existing.totalMinutes += te.duration || 0
    if (te.billable) existing.billableMinutes += te.duration || 0
    const hours = (te.duration || 0) / 60
    const rate = te.hourlyRate ? parseFloat(te.hourlyRate.toString()) : 0
    existing.totalCost += hours * rate
    if (rate > 0) existing.rate = rate // last non-zero rate
    existing.entries += 1
    userTimeMap.set(uid, existing)
  }

  const timeByUser = Array.from(userTimeMap.values())
    .sort((a, b) => b.totalCost - a.totalCost)
    .map(u => ({
      userId: u.id,
      userName: u.name,
      hours: r(u.totalMinutes / 60),
      billableHours: r(u.billableMinutes / 60),
      hourlyRate: r(u.rate),
      totalCost: r(u.totalCost),
      entries: u.entries,
    }))

  const totalMinutes = timeAgg._sum.duration || 0
  const billableMinutes = billableTimeAgg._sum.duration || 0
  const expenseCost = expenseAgg._sum.amount ? parseFloat(expenseAgg._sum.amount.toString()) : 0
  const totalCost = timeCost + expenseCost + costs
  const profitability = revenue - totalCost
  const profitabilityRate = revenue > 0 ? (profitability / revenue) * 100 : 0

  const r = (n: number) => Math.round(n * 100) / 100

  // Return project without the raw invoice/quote/PO arrays (we send counts + financials instead)
  const { invoices: _invoices, quotes: _quotes, purchaseOrders: _pos, ...projectData } = project

  return apiSuccess({
    project: projectData,
    financials: {
      revenue: r(revenue),
      costs: r(costs),
      margin: r(margin),
      marginRate: r(marginRate),
      quotedAmount: r(quotedAmount),
      paidAmount: r(paidAmount),
      outstandingAmount: r(outstandingAmount),
      // Profitability
      totalHours: r(totalMinutes / 60),
      billableHours: r(billableMinutes / 60),
      timeCost: r(timeCost),
      expenseCost: r(expenseCost),
      totalCost: r(totalCost),
      profitability: r(profitability),
      profitabilityRate: r(profitabilityRate),
      timeEntryCount: timeAgg._count,
      expenseCount: expenseAgg._count,
      timeByUser,
    },
  })
})

// ============================================
// PUT /api/projects/[id] - Update project
// ============================================
export const PUT = withApiMiddleware(async (req: NextRequest, context) => {
  const { id } = await context.params

  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) {
    return apiError('Projet non trouve', 404)
  }

  const body = await req.json()

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name : undefined,
      description: body.description !== undefined ? (body.description || null) : undefined,
      status: body.status !== undefined ? body.status : undefined,
      clientId: body.clientId !== undefined ? body.clientId : undefined,
      startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
      budget: body.budget !== undefined ? body.budget : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'project',
    entityId: id,
    changes: diffChanges(existing, project),
  })

  return apiSuccess(project)
})

// ============================================
// DELETE /api/projects/[id] - Delete project
// ============================================
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const existing = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { quotes: true, invoices: true, purchaseOrders: true } },
    },
  })

  if (!existing) {
    return apiError('Projet non trouve', 404)
  }

  const linked = []
  if (existing._count.quotes > 0) linked.push(`${existing._count.quotes} devis`)
  if (existing._count.invoices > 0) linked.push(`${existing._count.invoices} facture(s)`)
  if (existing._count.purchaseOrders > 0) linked.push(`${existing._count.purchaseOrders} bon(s) de commande`)

  if (linked.length > 0) {
    return apiError(
      `Impossible de supprimer ce projet car il est lie a ${linked.join(', ')}. Supprimez d'abord les documents associes.`,
      400
    )
  }

  // Delete tasks first (cascade not automatic)
  await prisma.task.deleteMany({ where: { projectId: id } })
  await prisma.project.delete({ where: { id } })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'project',
    entityId: id,
    metadata: { name: existing.name },
  })

  return apiSuccess({ deleted: true })
})
