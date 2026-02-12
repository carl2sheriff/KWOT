import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'

/**
 * POST /api/auth/setup - Create initial admin user
 * This endpoint only works when no users with passwords exist in the database.
 * It is disabled once any user has a password set.
 */
export async function POST(req: NextRequest) {
  try {
    // Check if any users with passwords exist
    const existingUsers = await prisma.user.count({
      where: { passwordHash: { not: null } },
    })

    if (existingUsers > 0) {
      return Response.json(
        { success: false, error: 'Setup deja effectue. Utilisez /login pour vous connecter.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return Response.json(
        { success: false, error: 'Email, mot de passe et nom requis' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return Response.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caracteres' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 12)

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        role: 'admin',
        isActive: true,
      },
      create: {
        email,
        name,
        passwordHash,
        role: 'admin',
        isActive: true,
      },
    })

    return Response.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        message: 'Administrateur cree. Vous pouvez maintenant vous connecter sur /login.',
      },
    })
  } catch (error) {
    console.error('[AUTH SETUP] Error:', error)
    return Response.json(
      { success: false, error: 'Erreur lors de la creation du compte' },
      { status: 500 }
    )
  }
}
