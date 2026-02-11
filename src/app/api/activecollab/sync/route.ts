import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import {
  fetchACProjects,
  fetchACTimeRecords,
  fetchACExpenses,
  fetchACJobTypes,
  fetchACUsers,
  matchProjectsByName,
  type ACConfig,
  type ACTimeRecord,
  type ACExpense,
} from '@/lib/activecollab'
import { createAuditLog } from '@/lib/audit'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

export const POST = withApiMiddleware(async () => {
  const settings = await prisma.companySettings.findFirst()

  if (!settings?.acAccountId || !settings?.acApiToken) {
    return apiError('ActiveCollab non configure', 400)
  }

  const config: ACConfig = {
    accountId: settings.acAccountId,
    apiToken: settings.acApiToken,
  }

  // Fetch AC data
  const [acProjects, jobTypes, acUsers] = await Promise.all([
    fetchACProjects(config),
    fetchACJobTypes(config),
    fetchACUsers(config),
  ])

  // Build job type rate lookup
  const jobRates = new Map(jobTypes.map(jt => [jt.id, jt.default_hourly_rate]))

  // Build AC user lookup and ensure KWOT users exist
  const acUserMap = new Map<number, string>() // AC user ID -> KWOT user ID
  for (const acUser of acUsers) {
    const email = acUser.email || `ac-user-${acUser.id}@activecollab.local`
    const kwotUser = await prisma.user.upsert({
      where: { email },
      update: { name: `${acUser.first_name} ${acUser.last_name}`.trim() },
      create: {
        email,
        name: `${acUser.first_name} ${acUser.last_name}`.trim(),
        role: 'user',
      },
    })
    acUserMap.set(acUser.id, kwotUser.id)
  }

  // Get all KWOT projects for matching
  const kwotProjects = await prisma.project.findMany({
    select: { id: true, name: true },
  })

  const { matched, unmatched } = matchProjectsByName(acProjects, kwotProjects)

  let timeCreated = 0
  let timeUpdated = 0
  let expenseCreated = 0
  let expenseUpdated = 0

  // Sync time records and expenses for each matched project
  for (const match of matched) {
    const [timeRecords, expenses] = await Promise.all([
      fetchACTimeRecords(config, match.acProject.id),
      fetchACExpenses(config, match.acProject.id),
    ])

    // Sync time records
    for (const tr of timeRecords) {
      const userId = acUserMap.get(tr.user_id) || TEMP_USER_ID
      const result = await upsertTimeRecord(tr, match.kwotProjectId, userId, jobRates)
      if (result === 'created') timeCreated++
      else timeUpdated++
    }

    // Sync expenses
    for (const exp of expenses) {
      const userId = acUserMap.get(exp.user_id) || TEMP_USER_ID
      const result = await upsertExpense(exp, match.kwotProjectId, userId)
      if (result === 'created') expenseCreated++
      else expenseUpdated++
    }
  }

  // Update last sync timestamp
  await prisma.companySettings.update({
    where: { id: settings.id },
    data: { acLastSyncAt: new Date() },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'project',
    entityId: settings.id,
    metadata: {
      source: 'activecollab',
      matched: matched.length,
      unmatched: unmatched.length,
      timeRecords: { created: timeCreated, updated: timeUpdated },
      expenses: { created: expenseCreated, updated: expenseUpdated },
    },
  })

  return apiSuccess({
    matched: matched.map(m => ({
      acProject: m.acProject.name,
      kwotProject: m.kwotProjectName,
    })),
    unmatched: unmatched.map(u => u.name),
    timeRecords: { created: timeCreated, updated: timeUpdated },
    expenses: { created: expenseCreated, updated: expenseUpdated },
  })
})

async function upsertTimeRecord(
  tr: ACTimeRecord,
  projectId: string,
  userId: string,
  jobRates: Map<number, number>,
): Promise<'created' | 'updated'> {
  const durationMinutes = Math.round(tr.value * 60)
  const hourlyRate = jobRates.get(tr.job_type_id) || null
  const recordDate = new Date(tr.record_date * 1000)

  const existing = await prisma.timeEntry.findUnique({ where: { acId: tr.id } })

  if (existing) {
    await prisma.timeEntry.update({
      where: { acId: tr.id },
      data: {
        description: tr.summary || null,
        duration: durationMinutes,
        hourlyRate: hourlyRate,
        billable: tr.billable_status === 1,
        startTime: recordDate,
        updatedAt: new Date(),
      },
    })
    return 'updated'
  }

  await prisma.timeEntry.create({
    data: {
      projectId,
      userId,
      description: tr.summary || null,
      startTime: recordDate,
      duration: durationMinutes,
      hourlyRate: hourlyRate,
      billable: tr.billable_status === 1,
      acId: tr.id,
      acProjectId: tr.parent_type === 'Project' ? tr.parent_id : null,
    },
  })
  return 'created'
}

async function upsertExpense(
  exp: ACExpense,
  projectId: string,
  userId: string,
): Promise<'created' | 'updated'> {
  const recordDate = new Date(exp.record_date * 1000)

  const existing = await prisma.expense.findUnique({ where: { acId: exp.id } })

  if (existing) {
    await prisma.expense.update({
      where: { acId: exp.id },
      data: {
        description: exp.summary || 'Depense ActiveCollab',
        amount: exp.value,
        date: recordDate,
        billable: exp.billable_status === 1,
      },
    })
    return 'updated'
  }

  await prisma.expense.create({
    data: {
      projectId,
      userId,
      category: 'other',
      description: exp.summary || 'Depense ActiveCollab',
      amount: exp.value,
      date: recordDate,
      billable: exp.billable_status === 1,
      acId: exp.id,
      acProjectId: exp.parent_type === 'Project' ? exp.parent_id : null,
    },
  })
  return 'created'
}
