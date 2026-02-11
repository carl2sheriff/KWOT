import '@/app/globals.css'

export const metadata = {
  title: 'KWOT - Portail Fournisseur',
}

export default function ExtranetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-zinc-800/50 bg-surface-raised">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg text-zinc-100">KWOT</span>
            <span className="font-bold text-lg bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">FINANCE</span>
            <span className="text-xs text-zinc-500 ml-3">Portail Fournisseur</span>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
