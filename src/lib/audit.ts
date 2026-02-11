import { prisma } from './db'

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'APPROVE'
  | 'REJECT'
  | 'SEND'
  | 'PAYMENT'
  | 'CREDIT'

interface AuditLogInput {
  userId: string
  action: AuditAction
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export async function createAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes ? JSON.parse(JSON.stringify(input.changes)) : undefined,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      ipAddress: input.ipAddress,
    },
  })
}

export function diffChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const key of Object.keys(newData)) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = { from: oldData[key], to: newData[key] }
    }
  }

  return changes
}
