import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { createAuditLog } from '@/lib/audit'
import { randomBytes } from 'crypto'

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'

// POST /api/suppliers/[id]/access-token - Generate new access token
export const POST = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!supplier) {
    return apiError('Fournisseur introuvable', 404)
  }

  // Generate a 32-byte hex token
  const token = randomBytes(32).toString('hex')
  // Token expires in 1 year
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      accessToken: token,
      accessTokenExpiresAt: expiresAt,
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'supplier',
    entityId: id,
    metadata: { action: 'access_token_generated', supplierName: supplier.name },
  })

  return apiSuccess({
    accessToken: updated.accessToken,
    accessTokenExpiresAt: updated.accessTokenExpiresAt,
  })
})

// DELETE /api/suppliers/[id]/access-token - Revoke access token
export const DELETE = withApiMiddleware(async (_req, context) => {
  const { id } = await context.params

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!supplier) {
    return apiError('Fournisseur introuvable', 404)
  }

  await prisma.supplier.update({
    where: { id },
    data: {
      accessToken: null,
      accessTokenExpiresAt: null,
    },
  })

  await createAuditLog({
    userId: TEMP_USER_ID,
    action: 'UPDATE',
    entityType: 'supplier',
    entityId: id,
    metadata: { action: 'access_token_revoked', supplierName: supplier.name },
  })

  return apiSuccess({ revoked: true })
})
