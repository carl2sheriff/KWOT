'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ backgroundColor: '#09090B', color: '#e4e4e7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Erreur critique
            </h2>
            <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '24px' }}>
              Une erreur inattendue s&apos;est produite. Notre equipe a ete notifiee.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
