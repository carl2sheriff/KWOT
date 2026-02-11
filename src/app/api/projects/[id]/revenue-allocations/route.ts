import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { InvoiceStatus } from '@prisma/client'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// Statuses that count as "revenue" for allocation calculations
const REVENUE_STATUSES: InvoiceStatus[] = ['SENT', 'PAID', 'PARTIALLY_PAID']

// ============================================
// GET /api/projects/[id]/revenue-allocations
// ============================================
export const GET = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  // Check project exists
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!project) {
    return apiError('Projet non trouve', 404)
  }

  // Get allocations
  const allocations = await prisma.revenueAllocation.findMany({
    where: { projectId: id },
    orderBy: { month: 'asc' },
  })

  // Calculate total project revenue (sum of invoice totals for relevant statuses)
  const revenueResult = await prisma.invoice.aggregate({
    where: {
      projectId: id,
      status: { in: REVENUE_STATUSES },
    },
    _sum: { total: true },
  })

  const totalRevenue = Number(revenueResult._sum?.total ?? 0)

  return apiSuccess({
    projectId: id,
    projectName: project.name,
    totalRevenue,
    allocations,
  })
})

// ============================================
// POST /api/projects/[id]/revenue-allocations
// Set/replace all allocations for a project
// ============================================
export const POST = withApiMiddleware(async (req: NextRequest, context) => {
  const { id } = await context.params

  // Check project exists
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!project) {
    return apiError('Projet non trouve', 404)
  }

  const body = await req.json()
  const { allocations } = body

  if (!Array.isArray(allocations)) {
    return apiError('Le champ allocations doit etre un tableau', 400)
  }

  // Validate each allocation
  for (const alloc of allocations) {
    if (!alloc.month || typeof alloc.month !== 'string' || !/^\d{4}-\d{2}$/.test(alloc.month)) {
      return apiError('Format de mois invalide, attendu YYYY-MM', 400)
    }

    if (typeof alloc.percentage !== 'number' || alloc.percentage < 0 || alloc.percentage > 100) {
      return apiError('Le pourcentage doit etre entre 0 et 100', 400)
    }
  }

  // Validate percentages sum to 100
  const totalPercentage = allocations.reduce((sum: number, a: { percentage: number }) => sum + a.percentage, 0)
  const roundedTotal = Math.round(totalPercentage * 100) / 100

  if (roundedTotal !== 100) {
    return apiError(
      `Les pourcentages doivent totaliser 100% (actuellement ${roundedTotal}%)`,
      400
    )
  }

  // Check for duplicate months
  const months = allocations.map((a: { month: string }) => a.month)
  const uniqueMonths = new Set(months)
  if (uniqueMonths.size !== months.length) {
    return apiError('Chaque mois ne peut apparaitre qu\'une seule fois', 400)
  }

  // Calculate total project revenue
  const revenueResult = await prisma.invoice.aggregate({
    where: {
      projectId: id,
      status: { in: REVENUE_STATUSES },
    },
    _sum: { total: true },
  })

  const totalRevenue = Number(revenueResult._sum?.total ?? 0)

  // Replace all allocations in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing allocations for this project
    await tx.revenueAllocation.deleteMany({
      where: { projectId: id },
    })

    // Create new allocations
    const created = await tx.revenueAllocation.createManyAndReturn({
      data: allocations.map((alloc: { month: string; percentage: number; notes?: string }) => ({
        projectId: id,
        month: alloc.month,
        percentage: alloc.percentage,
        amount: Math.round(totalRevenue * (alloc.percentage / 100) * 100) / 100,
        notes: alloc.notes || null,
      })),
    })

    return created
  })

  // Audit log
  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'revenue_allocation',
    entityId: id,
    metadata: {
      projectName: project.name,
      allocationCount: result.length,
      totalRevenue,
    },
  })

  return apiSuccess({
    projectId: id,
    projectName: project.name,
    totalRevenue,
    allocations: result,
  })
})
