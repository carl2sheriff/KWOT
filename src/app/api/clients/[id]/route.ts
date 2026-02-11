import { NextRequest } from 'next/server'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { updateClientSchema } from '@/lib/schemas'

// GET /api/clients/[id] - Get single client
export const GET = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: {
        select: { projects: true, contacts: true, quotes: true, invoices: true },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!client) {
    return apiError('Client non trouve', 404)
  }

  return apiSuccess(client)
})

// PUT /api/clients/[id] - Update client
export const PUT = withApiMiddleware(async (
  req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const body = await req.json()
  const parsed = updateClientSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('Validation error', 400, parsed.error.flatten().fieldErrors)
  }

  const existing = await prisma.client.findUnique({ where: { id } })
  if (!existing) {
    return apiError('Client non trouve', 404)
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email !== undefined ? (parsed.data.email || null) : undefined,
      phone: parsed.data.phone !== undefined ? (parsed.data.phone || null) : undefined,
      company: parsed.data.company !== undefined ? (parsed.data.company || null) : undefined,
      address: parsed.data.address !== undefined ? (parsed.data.address || null) : undefined,
      notes: parsed.data.notes !== undefined ? (parsed.data.notes || null) : undefined,
    },
  })

  return apiSuccess(client)
})

// DELETE /api/clients/[id] - Delete client
export const DELETE = withApiMiddleware(async (
  _req: NextRequest,
  context
) => {
  const { id } = await context.params
  if (!id) return apiError('ID requis', 400)

  const existing = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: { select: { projects: true, quotes: true, invoices: true } },
    },
  })

  if (!existing) {
    return apiError('Client non trouve', 404)
  }

  const linked = []
  if (existing._count.projects > 0) linked.push(`${existing._count.projects} projet(s)`)
  if (existing._count.quotes > 0) linked.push(`${existing._count.quotes} devis`)
  if (existing._count.invoices > 0) linked.push(`${existing._count.invoices} facture(s)`)

  if (linked.length > 0) {
    return apiError(
      `Impossible de supprimer ce client car il est lie a ${linked.join(', ')}. Supprimez d'abord les documents associes.`,
      400
    )
  }

  // Delete contacts first
  await prisma.contact.deleteMany({ where: { clientId: id } })
  await prisma.client.delete({ where: { id } })

  return apiSuccess({ deleted: true })
})
