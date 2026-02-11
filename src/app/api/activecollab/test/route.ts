import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'
import { prisma } from '@/lib/db'
import { testACConnection } from '@/lib/activecollab'

export const GET = withApiMiddleware(async () => {
  const settings = await prisma.companySettings.findFirst()

  if (!settings?.acAccountId || !settings?.acApiToken) {
    return apiError('ActiveCollab non configure. Renseignez le Account ID et le Token API dans les parametres.', 400)
  }

  const result = await testACConnection({
    accountId: settings.acAccountId,
    apiToken: settings.acApiToken,
  })

  if (!result.ok) {
    return apiError(`Connexion ActiveCollab echouee: ${result.error}`, 502)
  }

  return apiSuccess({
    connected: true,
    projectCount: result.projectCount,
  })
})
