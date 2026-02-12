'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-danger" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          {process.env.NODE_ENV === 'development' ? error.message : 'Le chargement de cette page a echoue. Veuillez reessayer.'}
        </p>
        {error.digest && (
          <p className="text-2xs text-zinc-600 mb-4 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
        >
          <RefreshCw size={14} />
          Reessayer
        </button>
      </div>
    </div>
  )
}
