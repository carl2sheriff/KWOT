import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api-middleware'
import { createAuditLog } from '@/lib/audit'
import { timingSafeEqual } from 'crypto'
import { z } from 'zod'

// Temporary user ID until auth is implemented
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

const WEBHOOK_SECRET = (process.env.NAVIGATOR_WEBHOOK_SECRET || '').trim()

// ============================================
// Webhook payload validation schema
// ============================================
const webhookClientSchema = z.object({
  id: z.string(),
  nom: z.string(),
}).nullable()

const webhookBuSchema = z.object({
  id: z.string(),
  nom: z.string(),
  numero: z.string(),
}).nullable().optional()

const webhookResponsableSchema = z.object({
  id: z.string(),
  prenom: z.string(),
  nom: z.string(),
}).nullable().optional()

const webhookDataSchema = z.object({
  id: z.string(),
  nom: z.string().max(500),
  numero: z.string().max(100).nullable(),
  type: z.string().max(100),
  statut: z.string().max(100),
  dateDebut: z.string().nullable(),
  dateFin: z.string().nullable(),
  budgetPrevisionnel: z.number().nullable(),
  informationsComplementaires: z.string().max(5000).nullable().optional(),
  client: webhookClientSchema,
  businessUnit: webhookBuSchema,
  responsable: webhookResponsableSchema,
})

const webhookPayloadSchema = z.object({
  event: z.enum(['project.created', 'project.updated']),
  data: webhookDataSchema,
})

// ============================================
// Constant-time string comparison
// ============================================
function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false
  try {
    const bufA = Buffer.from(a, 'utf-8')
    const bufB = Buffer.from(b, 'utf-8')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

// ============================================
// POST /api/webhooks/navigator - Receive project sync from Navigator v1
// ============================================
export async function POST(req: NextRequest) {
  try {
    // Validate webhook secret with timing-safe comparison
    const authHeader = req.headers.get('x-webhook-secret')
    if (!WEBHOOK_SECRET || !authHeader || !safeCompare(authHeader, WEBHOOK_SECRET)) {
      return apiError('Unauthorized', 401)
    }

    // Parse and validate body with Zod
    const rawBody = await req.json()
    const parsed = webhookPayloadSchema.safeParse(rawBody)

    if (!parsed.success) {
      return apiError('Payload invalide', 400)
    }

    const { event, data } = parsed.data

    if (event === 'project.created' || event === 'project.updated') {
      return await handleProjectSync(data)
    }

    return apiError(`Evenement non supporte: ${event}`, 400)
  } catch (error) {
    console.error('[WEBHOOK NAVIGATOR] Error:', error)
    return apiError('Erreur webhook', 500)
  }
}

async function handleProjectSync(data: z.infer<typeof webhookDataSchema>) {
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

  // 1. Find or create client in KWOT
  let kwotClientId: string

  if (data.client) {
    const existingClient = await prisma.client.findUnique({
      where: { navigatorId: data.client.id },
    })

    if (existingClient) {
      kwotClientId = existingClient.id
    } else {
      const newClient = await prisma.client.create({
        data: {
          name: data.client.nom,
          company: data.client.nom,
          status: 'active',
          navigatorId: data.client.id,
          createdById: TEMP_USER_ID,
        },
      })
      kwotClientId = newClient.id

      await createAuditLog({
        userId: TEMP_USER_ID,
        action: 'CREATE',
        entityType: 'client',
        entityId: newClient.id,
        metadata: { source: 'navigator', navigatorClientId: data.client.id },
      })
    }
  } else {
    // No client in Navigator - create a placeholder
    const placeholder = await prisma.client.upsert({
      where: { navigatorId: 'no-client' },
      update: {},
      create: {
        name: 'Client non defini (Navigator)',
        status: 'prospect',
        navigatorId: 'no-client',
        createdById: TEMP_USER_ID,
      },
    })
    kwotClientId = placeholder.id
  }

  // 2. Build description from Navigator data
  const descParts: string[] = []
  if (data.numero) descParts.push(`Ref: ${data.numero}`)
  if (data.type) descParts.push(`Type: ${data.type}`)
  if (data.businessUnit) descParts.push(`BU: ${data.businessUnit.nom}`)
  if (data.responsable) descParts.push(`Responsable: ${data.responsable.prenom} ${data.responsable.nom}`)
  if (data.informationsComplementaires) descParts.push(data.informationsComplementaires)

  const description = descParts.length > 0 ? descParts.join(' | ') : null

  // 3. Check if project already exists (update vs create)
  const existingProject = await prisma.project.findUnique({
    where: { navigatorId: data.id },
  })

  if (existingProject) {
    // Update existing project
    const updated = await prisma.project.update({
      where: { id: existingProject.id },
      data: {
        name: data.nom,
        description,
        clientId: kwotClientId,
        startDate: data.dateDebut ? new Date(data.dateDebut) : null,
        endDate: data.dateFin ? new Date(data.dateFin) : null,
        budget: data.budgetPrevisionnel ?? null,
        navigatorRef: data.numero,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    await createAuditLog({
      userId: TEMP_USER_ID,
      action: 'UPDATE',
      entityType: 'project',
      entityId: updated.id,
      metadata: { source: 'navigator', navigatorProjectId: data.id },
    })

    return apiSuccess(updated)
  }

  // Create new project
  const project = await prisma.project.create({
    data: {
      name: data.nom,
      description,
      status: 'quote_waiting',
      clientId: kwotClientId,
      ownerId: TEMP_USER_ID,
      startDate: data.dateDebut ? new Date(data.dateDebut) : null,
      endDate: data.dateFin ? new Date(data.dateFin) : null,
      budget: data.budgetPrevisionnel ?? null,
      navigatorId: data.id,
      navigatorRef: data.numero,
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'CREATE',
    entityType: 'project',
    entityId: project.id,
    metadata: { source: 'navigator', navigatorProjectId: data.id, navigatorRef: data.numero },
  })

  return apiSuccess(project)
}
