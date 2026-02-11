import { prisma } from '@/lib/db'
import { withApiMiddleware, apiSuccess } from '@/lib/api-middleware'

// ============================================
// GET /api/users - List all users
// ============================================
export const GET = withApiMiddleware(async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  })

  return apiSuccess(users)
})
