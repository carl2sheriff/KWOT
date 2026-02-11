// ActiveCollab Cloud API Client
// Docs: https://developers.activecollab.com/api-documentation/

interface ACConfig {
  accountId: string
  apiToken: string
}

interface ACProject {
  id: number
  name: string
  is_completed: boolean
  is_trashed: boolean
  budget: number | null
  created_on: number
  updated_on: number
}

interface ACTimeRecord {
  id: number
  value: number // hours (decimal)
  record_date: number // unix timestamp
  user_id: number
  user_name?: string
  parent_type: 'Task' | 'Project'
  parent_id: number
  job_type_id: number
  billable_status: number // 0 = non-billable, 1 = billable
  summary: string | null
  is_trashed: boolean
  created_on: number
  updated_on: number
}

interface ACExpense {
  id: number
  value: number
  record_date: number // unix timestamp
  user_id: number
  user_name?: string
  parent_type: 'Task' | 'Project'
  parent_id: number
  category_id: number
  billable_status: number
  summary: string | null
  is_trashed: boolean
  created_on: number
  updated_on: number
}

interface ACJobType {
  id: number
  name: string
  default_hourly_rate: number
  is_default: boolean
}

interface ACUser {
  id: number
  first_name: string
  last_name: string
  email: string
}

export interface ProjectMatch {
  acProject: ACProject
  kwotProjectId: string
  kwotProjectName: string
}

export interface SyncResult {
  matched: ProjectMatch[]
  unmatched: ACProject[]
  timeRecords: { created: number; updated: number }
  expenses: { created: number; updated: number }
}

function getBaseUrl(accountId: string): string {
  return `https://app.activecollab.com/${accountId}/api/v1`
}

async function acFetch<T>(config: ACConfig, path: string): Promise<T> {
  const url = `${getBaseUrl(config.accountId)}${path}`
  const response = await fetch(url, {
    headers: {
      'X-Angie-AuthApiToken': config.apiToken,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`ActiveCollab API error (${response.status}): ${text}`)
  }

  return response.json() as Promise<T>
}

export async function fetchACProjects(config: ACConfig): Promise<ACProject[]> {
  const projects: ACProject[] = []
  let page = 1

  while (true) {
    const data = await acFetch<ACProject[]>(config, `/projects?page=${page}`)
    if (!data || data.length === 0) break
    projects.push(...data.filter(p => !p.is_trashed && !p.is_completed))
    page++
    if (data.length < 50) break // likely last page
  }

  return projects
}

export async function fetchACTimeRecords(
  config: ACConfig,
  projectId: number,
  from?: string,
  to?: string,
): Promise<ACTimeRecord[]> {
  let path = `/projects/${projectId}/time-records`
  if (from && to) {
    path = `/projects/${projectId}/time-records/filtered-by-date?from=${from}&to=${to}`
  }

  const data = await acFetch<{ time_records?: ACTimeRecord[] } | ACTimeRecord[]>(config, path)

  // API may return { time_records: [...] } or just [...]
  const records = Array.isArray(data) ? data : (data.time_records || [])
  return records.filter(r => !r.is_trashed)
}

export async function fetchACExpenses(
  config: ACConfig,
  projectId: number,
): Promise<ACExpense[]> {
  const data = await acFetch<{ expenses?: ACExpense[] } | ACExpense[]>(config, `/projects/${projectId}/expenses`)

  const records = Array.isArray(data) ? data : (data.expenses || [])
  return records.filter(r => !r.is_trashed)
}

export async function fetchACJobTypes(config: ACConfig): Promise<ACJobType[]> {
  return acFetch<ACJobType[]>(config, '/job-types')
}

export async function fetchACUsers(config: ACConfig): Promise<ACUser[]> {
  return acFetch<ACUser[]>(config, '/users')
}

export async function testACConnection(config: ACConfig): Promise<{ ok: boolean; projectCount: number; error?: string }> {
  try {
    const projects = await acFetch<ACProject[]>(config, '/projects')
    return { ok: true, projectCount: projects.length }
  } catch (error) {
    return { ok: false, projectCount: 0, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

// Match AC projects to KWOT projects by name (case-insensitive, trimmed)
export function matchProjectsByName(
  acProjects: ACProject[],
  kwotProjects: { id: string; name: string }[],
): { matched: ProjectMatch[]; unmatched: ACProject[] } {
  const matched: ProjectMatch[] = []
  const unmatched: ACProject[] = []

  // Build a lookup map of normalized KWOT project names
  const kwotMap = new Map<string, { id: string; name: string }>()
  for (const kp of kwotProjects) {
    kwotMap.set(normalize(kp.name), kp)
  }

  for (const acProject of acProjects) {
    const normalizedName = normalize(acProject.name)
    const match = kwotMap.get(normalizedName)

    if (match) {
      matched.push({
        acProject,
        kwotProjectId: match.id,
        kwotProjectName: match.name,
      })
    } else {
      unmatched.push(acProject)
    }
  }

  return { matched, unmatched }
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export type { ACConfig, ACProject, ACTimeRecord, ACExpense, ACJobType, ACUser }
