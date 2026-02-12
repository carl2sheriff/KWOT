import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
            isActive: true,
          },
        })

        if (!user || !user.passwordHash || !user.isActive) {
          return null
        }

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user
      const isOnDashboard = request.nextUrl.pathname.startsWith('/')
      const isOnLogin = request.nextUrl.pathname === '/login'
      const isApi = request.nextUrl.pathname.startsWith('/api/')
      const isPublicApi = request.nextUrl.pathname.startsWith('/api/health')
        || request.nextUrl.pathname.startsWith('/api/webhooks/')
        || request.nextUrl.pathname.startsWith('/api/auth/')
        || request.nextUrl.pathname.startsWith('/api/extranet/')

      // Public API routes don't need auth
      if (isPublicApi) return true

      // API routes need auth
      if (isApi && !isLoggedIn) {
        return Response.json(
          { success: false, error: 'Non authentifie' },
          { status: 401 }
        )
      }

      // If logged in and on login page, redirect to dashboard
      if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL('/', request.nextUrl))
      }

      // If not logged in and on dashboard, redirect to login
      if (!isLoggedIn && isOnDashboard && !isOnLogin) {
        return Response.redirect(new URL('/login', request.nextUrl))
      }

      return true
    },
  },
})
