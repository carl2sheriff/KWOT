import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * GET /api/gdpr/export - Export all personal data for the authenticated user
 * RGPD Article 20 - Droit a la portabilite des donnees
 */
export async function GET() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return Response.json(
      { success: false, error: 'Non authentifie' },
      { status: 401 }
    )
  }

  try {
    // Fetch all user-related data
    const [user, timeEntries, expenses, auditLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          hourlyRate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.timeEntry.findMany({
        where: { userId: currentUser.id },
        select: {
          id: true,
          startTime: true,
          duration: true,
          description: true,
          billable: true,
          hourlyRate: true,
          createdAt: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
      prisma.expense.findMany({
        where: { userId: currentUser.id },
        select: {
          id: true,
          category: true,
          description: true,
          amount: true,
          date: true,
          createdAt: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.auditLog.findMany({
        where: { userId: currentUser.id },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      format: 'RGPD_EXPORT_V1',
      user: {
        ...user,
        hourlyRate: user?.hourlyRate ? Number(user.hourlyRate) : null,
      },
      timeEntries: timeEntries.map((te) => ({
        ...te,
        hourlyRate: te.hourlyRate ? Number(te.hourlyRate) : null,
      })),
      expenses: expenses.map((exp) => ({
        ...exp,
        amount: Number(exp.amount),
      })),
      activityLog: auditLogs,
      metadata: {
        totalTimeEntries: timeEntries.length,
        totalExpenses: expenses.length,
        totalAuditLogs: auditLogs.length,
      },
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="kwot-export-${currentUser.id}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('[GDPR EXPORT] Error:', error)
    return Response.json(
      { success: false, error: 'Erreur lors de l\'export des donnees' },
      { status: 500 }
    )
  }
}
