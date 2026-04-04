# Finance CRM

CRM financier interne — gestion pipeline commercial, deals, contacts, projets, factures.

## Architecture

```
app/
  (auth)/login/          → Page de connexion
  (dashboard)/
    deals/               → Pipeline commercial (Kanban)
    invoices/            → Gestion factures
    projects/            → Suivi projets
    contacts/            → Contacts clients
    companies/           → Entreprises clientes
    settings/            → Paramètres
  api/                   → Endpoints REST (deals, invoices, projects, contacts, companies, activities, search, settings)
components/
  ui/                    → Composants shadcn/ui
  layout/                → Layout components
  charts/                → Graphiques Recharts
lib/
  db.ts                  → Client Prisma
  stores/                → Zustand stores
  validations/           → Schémas Zod
prisma/
  schema.prisma          → Schéma BDD
```

## Stack

- **Framework** : Next.js 14 + TypeScript
- **DB** : PostgreSQL (Neon) via Prisma 7
- **Auth** : NextAuth v5 (email/password)
- **UI** : Tailwind CSS 3 + shadcn/ui (Radix)
- **State** : Zustand
- **Charts** : Recharts
- **Deploy** : Vercel
- **Port dev** : 3008

## Variables d'environnement

```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3008
```

## Modèles DB (Prisma)

- **Profile** — Users (admin/member/viewer)
- **Company** — Organisations clientes
- **Contact** — Contacts individuels
- **Deal** — Opportunités (lead → qualified → proposal → negotiation → won/lost)
- **Project** — Projets liés aux deals
- **Invoice** — Factures
- **Activity** — Historique (calls, emails, meetings, tasks)

## Conventions

- TypeScript strict
- Prisma (pas Drizzle) — attention à ne pas confondre avec les autres projets
- shadcn/ui pour tous les composants
- Pipeline Kanban pour les deals
- Port 3008
