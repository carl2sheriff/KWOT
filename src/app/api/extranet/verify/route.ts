import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/extranet/verify - Verify supplier access token
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return Response.json({ success: false, error: 'Token requis' }, { status: 400 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { accessToken: token },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        accessTokenExpiresAt: true,
      },
    })

    if (!supplier) {
      return Response.json({ success: false, error: 'Token invalide' }, { status: 401 })
    }

    if (supplier.accessTokenExpiresAt && supplier.accessTokenExpiresAt < new Date()) {
      return Response.json({ success: false, error: 'Token expire' }, { status: 401 })
    }

    return Response.json({ success: true, data: { id: supplier.id, name: supplier.name, company: supplier.company, email: supplier.email } })
  } catch {
    return Response.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
