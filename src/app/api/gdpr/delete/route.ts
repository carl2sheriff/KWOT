import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { createAuditLog } from '@/lib/audit'

/**
 * POST /api/gdpr/delete - Anonymize or delete user data
 * RGPD Article 17 - Droit a l'effacement
 *
 * This endpoint anonymizes the user's personal data rather than hard-deleting,
 * because financial records must be retained for 7 years (French accounting law).
 * The user's identity is replaced with "Utilisateur anonymise".
 */
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return Response.json(
      { success: false, error: 'Non authentifie' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const { confirmEmail } = body

    // Require email confirmation to prevent accidental deletion
    if (confirmEmail !== currentUser.email) {
      return Response.json(
        { success: false, error: 'Veuillez confirmer votre email pour proceder a l\'effacement' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves if they're the only admin
    if (currentUser.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'admin', isActive: true, id: { not: currentUser.id } },
      })
      if (adminCount === 0) {
        return Response.json(
          { success: false, error: 'Impossible de supprimer le dernier administrateur' },
          { status: 400 }
        )
      }
    }

    // Anonymize user data
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        email: `anonymized-${currentUser.id}@deleted.kwot`,
        name: 'Utilisateur anonymise',
        passwordHash: null,
        avatar: null,
        hourlyRate: null,
        isActive: false,
      },
    })

    // Log the anonymization
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'user' as 'client',
      entityId: currentUser.id,
      metadata: { action: 'gdpr_anonymization', originalEmail: currentUser.email },
    })

    return Response.json({
      success: true,
      data: {
        message: 'Vos donnees personnelles ont ete anonymisees. Les documents financiers sont conserves conformement a la loi (7 ans).',
        anonymizedFields: ['email', 'name', 'passwordHash', 'avatar', 'hourlyRate'],
        retainedForLegal: ['timeEntries', 'expenses', 'auditLogs', 'financial documents'],
      },
    })
  } catch (error) {
    console.error('[GDPR DELETE] Error:', error)
    return Response.json(
      { success: false, error: 'Erreur lors de l\'anonymisation' },
      { status: 500 }
    )
  }
}
