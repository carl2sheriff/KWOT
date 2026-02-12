import { auth } from '@/lib/auth'

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    role: (session.user as { role?: string }).role || 'user',
  }
}

/**
 * Get the current user ID, falling back to TEMP_USER_ID for backwards compatibility.
 * This allows gradual migration from TEMP_USER_ID to real auth.
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser()
  return user?.id || '00000000-0000-0000-0000-000000000001'
}
