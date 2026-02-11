import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { createAuditLog, diffChanges } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// GET /api/time-entries/[id] - Get single time entry
export const GET = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const entry = await prisma.timeEntry.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true, clientId: true },
      },
    },
  })

  if (!entry) {
    return apiError('Entree de temps non trouvee', 404)
  }

  return apiSuccess(entry)
})

// PUT /api/time-entries/[id] - Update time entry
export const PUT = withApiMiddleware(async (
  req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const existing = await prisma.timeEntry.findUnique({ where: { id } })
  if (!existing) {
    return apiError('Entree de temps non trouvee', 404)
  }

  const body = await req.json()
  const { projectId, description, startTime, endTime, duration, hourlyRate, billable, taskId } = body

  // Validate project if changed
  if (projectId && projectId !== existing.projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return apiError('Projet non trouve', 404)
    }
  }

  // Calculate duration
  let calculatedDuration: number | null | undefined = undefined
  if (duration !== undefined) {
    calculatedDuration = duration !== null ? Math.round(Number(duration)) : null
  } else if (startTime || endTime) {
    const start = new Date(startTime || existing.startTime)
    const end = endTime ? new Date(endTime) : existing.endTime
    if (end) {
      calculatedDuration = Math.round((end.getTime() - start.getTime()) / 60000)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (projectId !== undefined) updateData.projectId = projectId
  if (description !== undefined) updateData.description = description || null
  if (startTime !== undefined) updateData.startTime = new Date(startTime)
  if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null
  if (calculatedDuration !== undefined) updateData.duration = calculatedDuration
  if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate
  if (billable !== undefined) updateData.billable = billable
  if (taskId !== undefined) updateData.taskId = taskId || null

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: updateData,
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  })

  const changes = diffChanges(
    existing as unknown as Record<string, unknown>,
    updateData
  )

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'time_entry',
    entityId: id,
    changes,
  })

  return apiSuccess(entry)
})

// DELETE /api/time-entries/[id] - Delete time entry
export const DELETE = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const existing = await prisma.timeEntry.findUnique({ where: { id } })
  if (!existing) {
    return apiError('Entree de temps non trouvee', 404)
  }

  if (existing.invoiced) {
    return apiError('Impossible de supprimer une entree deja facturee', 400)
  }

  await prisma.timeEntry.delete({ where: { id } })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'DELETE',
    entityType: 'time_entry',
    entityId: id,
  })

  return apiSuccess({ deleted: true })
})
