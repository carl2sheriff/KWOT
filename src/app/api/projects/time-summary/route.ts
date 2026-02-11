import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess } from '@/lib/api-middleware'
import { Prisma } from '@prisma/client'

// ============================================
// GET /api/projects/time-summary
// Returns projects with time tracking aggregates and BU info.
// Supports filtering by buId, search (project name), and status.
// ============================================
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)

  const buId = searchParams.get('buId') || ''
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  // Build project filter
  const where: Prisma.ProjectWhereInput = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  if (status) {
    where.status = status
  }

  if (buId) {
    where.buId = buId
  }

  // Fetch projects with client, BU, time entries (with user info), and expenses
  const projects = await prisma.project.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      bu: { select: { id: true, name: true, code: true } },
      timeEntries: {
        select: {
          id: true,
          userId: true,
          duration: true,
          hourlyRate: true,
          billable: true,
          user: { select: { id: true, name: true, hourlyRate: true } },
        },
      },
      expenses: {
        select: {
          id: true,
          amount: true,
        },
      },
      invoices: {
        where: { status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] } },
        select: { total: true },
      },
    },
  })

  // Aggregate time tracking and expense data per project
  const enriched = projects.map((project) => {
    const { timeEntries, expenses, invoices, ...projectData } = project

    // Time tracking aggregation
    let totalMinutes = 0
    let billableMinutes = 0
    let totalTimeCost = 0
    const userMap = new Map<string, { userId: string; userName: string; minutes: number; cost: number }>()

    for (const entry of timeEntries) {
      const minutes = entry.duration ?? 0
      totalMinutes += minutes
      if (entry.billable) {
        billableMinutes += minutes
      }

      // Cost: use entry hourlyRate, fall back to user default hourlyRate, then 0
      const rate = entry.hourlyRate
        ? Number(entry.hourlyRate)
        : entry.user.hourlyRate
          ? Number(entry.user.hourlyRate)
          : 0

      const hours = minutes / 60
      const entryCost = Math.round(hours * rate * 100) / 100
      totalTimeCost += entryCost

      // Per-user breakdown
      const existing = userMap.get(entry.userId)
      if (existing) {
        existing.minutes += minutes
        existing.cost += entryCost
      } else {
        userMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.user.name,
          minutes,
          cost: entryCost,
        })
      }
    }

    // Expense aggregation
    const expenseCost = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Totals
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100
    const billableHours = Math.round((billableMinutes / 60) * 100) / 100
    const timeCost = Math.round(totalTimeCost * 100) / 100
    const roundedExpenseCost = Math.round(expenseCost * 100) / 100
    const totalCostAll = Math.round((timeCost + roundedExpenseCost) * 100) / 100

    // User breakdown with hours instead of minutes
    const userBreakdown = Array.from(userMap.values()).map((u) => ({
      userId: u.userId,
      userName: u.userName,
      hours: Math.round((u.minutes / 60) * 100) / 100,
      cost: Math.round(u.cost * 100) / 100,
    }))

    // Budget utilization
    const budget = projectData.budget ? Number(projectData.budget) : null
    const budgetUtilization = budget && budget > 0
      ? Math.round((totalCostAll / budget) * 10000) / 100
      : null

    // MSCV provisoire = CA facture - (Temps + Depenses)
    const invoiceRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
    const mscvProvisoire = Math.round((invoiceRevenue - totalCostAll) * 100) / 100
    const mscvProvisoireRate = invoiceRevenue > 0
      ? Math.round(((invoiceRevenue - totalCostAll) / invoiceRevenue) * 10000) / 100
      : null

    return {
      id: projectData.id,
      name: projectData.name,
      status: projectData.status,
      budget: projectData.budget,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      client: projectData.client,
      bu: projectData.bu,
      timeSummary: {
        totalHours,
        billableHours,
        totalCost: timeCost,
        expenseCost: roundedExpenseCost,
        totalCostAll,
        uniqueUsers: userMap.size,
        userBreakdown,
      },
      budgetUtilization,
      invoiceRevenue: Math.round(invoiceRevenue * 100) / 100,
      mscvProvisoire,
      mscvProvisoireRate,
    }
  })

  // Sort by totalCost descending (most expensive projects first)
  enriched.sort((a, b) => b.timeSummary.totalCostAll - a.timeSummary.totalCostAll)

  return apiSuccess(enriched)
})
