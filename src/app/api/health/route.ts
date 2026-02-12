import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const start = Date.now()
  let dbOk = false

  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  const latency = Date.now() - start
  const status = dbOk ? 'healthy' : 'degraded'

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbOk ? 'up' : 'down',
          latencyMs: latency,
        },
      },
      version: process.env.npm_package_version || '0.1.0',
    },
    { status: dbOk ? 200 : 503 }
  )
}
