# Kwotmon (KWOT Finance)

Gestion devis/factures/avoirs avec CRM — système financier complet pour Sheriff Projects.

## Architecture

```
src/
  app/
    (dashboard)/         → Pages admin (devis, factures, clients, projets, fournisseurs, produits)
    api/
      clients/           → CRUD clients
      quotes/            → Gestion devis (versioning, milestones)
      invoices/          → Facturation
      payments/          → Suivi paiements
      suppliers/         → Fournisseurs
      purchase-orders/   → Bons de commande
      business-units/    → Business units
      products/          → Catalogue produits
      activecollab/      → Sync ActiveCollab
      reporting/         → Reporting CA
      settings/          → Paramètres société
    login/               → Auth
    extranet/            → Portail fournisseurs
  components/
    ui/                  → shadcn/ui (Radix)
    financial/           → Composants métier finance
  hooks/                 → Custom React hooks
  lib/                   → Utilitaires
prisma/
  schema.prisma          → 25+ tables (devis, factures, avoirs, PO, paiements, time entries...)
```

## Stack

- **Framework** : Next.js 15 + TypeScript
- **DB** : PostgreSQL (Neon) via Prisma 6
- **Auth** : NextAuth v5 (email/password)
- **Styling** : Tailwind CSS 3 + shadcn/ui
- **State** : Zustand
- **PDF** : jspdf + jspdf-autotable
- **Email** : Resend
- **Tests** : Vitest
- **Error tracking** : Sentry
- **Deploy** : Vercel
- **Port dev** : 3002

## Variables d'environnement

```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3002
NAVIGATOR_WEBHOOK_SECRET=...    # Sync Navigator v1
RESEND_API_KEY=re_...           # Optionnel
SENTRY_DSN=https://...          # Optionnel
```

## Documents financiers

- **Devis** : draft → sent → approved → rejected → expired → cancelled (avec versioning)
- **Factures** : draft → sent → paid → partially_paid → overdue → cancelled → credited
- **Avoirs** : retours/ajustements
- **Bons de commande** : commandes fournisseurs
- **Paiements** : virement, chèque, CB, espèces

## Intégrations externes

- **ActiveCollab** : sync time entries, expenses, projets (webhooks + API)
- **Navigator v1** : sync clients/projets via webhook
- **Resend** : envoi emails (devis, factures)
- **Sentry** : monitoring erreurs

## Conventions

- Prisma (pas Drizzle) — attention à ne pas confondre avec les autres projets Sheriff
- CSV import produits : `name;description;price;category;unit` (délimiteur point-virgule)
- ❌ Ne PAS utiliser middleware.ts dans Next.js 16 → utiliser proxy config
- ❌ Ne PAS utiliser sentry.client.config.ts (deprecated) → utiliser instrumentation-client.ts
- Components : PascalCase (`QuoteCard.tsx`)
- Utils/functions : camelCase
- Database : snake_case
- Mobile-first obligatoire
- Zero crash tolerance en production

*Last updated: 2026-04-04*
