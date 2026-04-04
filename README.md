# Sheriff Finance CRM

CRM financier interne pour la gestion du pipeline commercial, deals, contacts, projets et facturation.

## Fonctionnalités

- Pipeline commercial Kanban (lead → qualified → proposal → negotiation → won/lost)
- Gestion contacts et entreprises
- Suivi de projets liés aux deals
- Facturation
- Historique d'activités (calls, emails, meetings, tasks)
- Recherche globale
- Rôles utilisateurs (admin, member, viewer)

## Stack technique

- **Framework** : Next.js 14 + TypeScript
- **Base de données** : PostgreSQL (Neon) via Prisma 7
- **Auth** : NextAuth v5 (email/password)
- **UI** : Tailwind CSS 3 + shadcn/ui (Radix)
- **State** : Zustand
- **Charts** : Recharts
- **Déploiement** : Vercel

## Installation

```bash
git clone https://github.com/carl2sheriff/FINANCE.git
cd FINANCE
npm install
cp .env.example .env.local
npx prisma db push
npm run dev   # Port 3008
```

## Variables d'environnement

```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3008
```

---

Sheriff Projects — Paris
