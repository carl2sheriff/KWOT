'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Erreur de connexion. Veuillez reessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient">KWOT</h1>
          <p className="text-xs text-zinc-500 mt-1">Finance</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-zinc-100 mb-1">Connexion</h2>
          <p className="text-xs text-zinc-500 mb-6">Entrez vos identifiants pour acceder a KWOT Finance</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
                <AlertCircle size={14} className="text-danger flex-shrink-0" />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface border border-zinc-800/50 rounded-lg text-zinc-100 placeholder-zinc-600 outline-none focus:border-accent transition-colors"
                  placeholder="admin@kwot.fr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface border border-zinc-800/50 rounded-lg text-zinc-100 placeholder-zinc-600 outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-2xs text-zinc-600 mt-4">
          KWOT Finance &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
