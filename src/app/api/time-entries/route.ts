import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError, parsePagination, buildPagination } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { Prisma } from '@prisma/client'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// GET /api/time-entries - List time entries
export const GET = withApiMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const projectId = searchParams.get('projectId') || ''
  const userId = searchParams.get('userId') || ''
  const billable = searchParams.get('billable')
  const invoiced = searchParams.get('invoiced')
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  const where: Prisma.TimeEntryWhereInput = {}

  if (projectId) {
    where.projectId = projectId
  }

  if (userId) {
    where.userId = userId
  }

  if (billable !== null && billable !== '') {
    where.billable = billable === 'true'
  }

  if (invoiced !== null && invoiced !== '') {
    where.invoiced = invoiced === 'true'
  }

  if (dateFrom || dateTo) {
    where.startTime = {}
    if (dateFrom) {
      where.startTime.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.startTime.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
  }

  const [entries, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.timeEntry.count({ where }),
  ])

  const totals = await prisma.timeEntry.aggregate({
    where,
    _sum: { duration: true },
    _count: true,
  })

  return apiSuccess(
    {
      entries,
      summary: {
        totalMinutes: totals._sum.duration || 0,
        totalHours: Math.round(((totals._sum.duration || 0) / 60) * 100) / 100,
        count: totals._count,
      },
    },
    buildPagination(page, limit, total),
  )
})

// POST /api/time-entries - Create time entry
export const POST = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()

  const { projectId, description, startTime, endTime, duration, hourlyRate, billable, taskId } = body

  if (!projectId) {
    return apiError('projectId est requis', 400)
  }

  if (!startTime) {
    return apiError('startTime est requis', 400)
  }

  // Validate project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return apiError('Projet non trouve', 404)
  }

  // Ensure temp user exists
  await prisma.user.upsert({
    where: { id: TEMP_USER_ID },
    update: {},
    create: {
      id: TEMP_USER_ID,
      email: 'admin@kwot.fr',
      name: 'Admin KWOT',
      role: 'admin',
    },
  })

  // Calculate duration
  let calculatedDuration: number | null = null
  if (duration !== undefined && duration !== null) {
    calculatedDuration = Math.round(Number(duration))
  } else if (endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    calculatedDuration = Math.round((end.getTime() - start.getTime()) / 60000)
  }

  const entry = await prisma.timeEntry.create({
    data: {
      projectId,
      userId: TEMP_USER_ID,
      taskId: taskId || null,
      description: description || null,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration: calculatedDuration,
      hourlyRate: hourlyRate !== undefined ? hourlyRate : null,
      billable: billable !== undefined ? billable : true,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'time_entry',
    entityId: entry.id,
    changes: { projectId, description, startTime, duration: calculatedDuration },
  })

  return apiSuccess(entry)
})
