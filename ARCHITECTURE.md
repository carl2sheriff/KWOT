# Kwot - Architecture & Briques

## Stack Actuel

```
┌─────────────────────────────────────────────────────────┐
│                      KWOT                               │
├─────────────────────────────────────────────────────────┤
│  Frontend:    Next.js 15 (App Router)                  │
│  Styling:     Tailwind CSS                            │
│  Components:  Shadcn/ui (à utiliser)                   │
│  Auth:        NextAuth v5                              │
│  ORM:         Prisma + PostgreSQL (Neon)              │
│  PDF:         @react-pdf/renderer                      │
│  State:       React hooks / Zustand                    │
│  Icons:       Lucide React                             │
└─────────────────────────────────────────────────────────┘
```

---

## Briques & Choix

### 1. Auth → NextAuth v5 ✅
```bash
npm install next-auth@beta
```
**Usage:** Login email/password, session management
**Status:** Kwot a déjà (email/password)

---

### 2. Table → TanStack Table
```bash
npm install @tanstack/react-table
```
**Usage:** Liste factures, clients, devis
**Status:** ⏸️ Pas prioritaire
**Alternative:** Construire custom si besoin

---

### 3. Kanban Pipeline → @dnd-kit
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
**Usage:** Pipeline devis (Nouveau → Qualifié → Proposition → Signé)
**Status:** À développer from scratch
**Effort:** 2-3 jours
**Design:** Style luxe (emerald, glassmorphism)

---

### 4. Filters → React Hook Form + Zod
```bash
npm install react-hook-form zod zod-form-data @hookform/resolvers
```
**Usage:** Filtrer devis par statut, client, montant, date
**Status:** ⏸️ À faire

---

### 5. UI Components → Shadcn/ui ✅ (installé)
```bash
npx shadcn@latest add button input dialog dropdown-menu card
```
**Usage:** Buttons, inputs, modals, cards
**Status:** ✅ Prêt à utiliser
**Doc:** https://ui.shadcn.com

---

### 6. PDF Generation → @react-pdf/renderer ✅
```bash
npm install @react-pdf/renderer
```
**Usage:** Devis, factures PDF
**Status:** Kwot a déjà
**Action:** Améliorer templates luxe

---

### 7. Emails → Resend
```bash
npm install resend
```
**Usage:** Envoyer devis, factures par email
**Status:** ⏸️ Optionnel
**Setup:** https://resend.com

---

### 8. ORM → Prisma ✅
```bash
npm install prisma --save-dev
npm install @prisma/client
```
**Usage:** Database access
**Status:** Kwot a déjà

---

### 9. Notifications → React Hot Toast
```bash
npm install react-hot-toast
```
**Usage:** Feedback (success, error, loading)
**Status:** ⏸️ Installer
**Quick win:** 5 minutes

---

### 10. Icons → Lucide React ✅
```bash
npm install lucide-react
```
**Usage:** Icônes UI
**Status:** Kwot a déjà

---

### 11. Date handling → date-fns
```bash
npm install date-fns
```
**Usage:** Format dates, calculs
**Status:** ⏸️ À vérifier si installé

---

### 12. HTTP Client → Axios ou Fetch
**Usage:** API calls
**Status:** Utiliser fetch natif (Next.js)

---

## Intégration Twenty (La Machine)

### Option API-first (Recommandée)

```
┌──────────────┐     API      ┌──────────────┐
│   KWOT       │ ←──────────→ │   TWENTY     │
│  (Écrin)     │   REST/Graph │  (Machine)   │
│              │              │              │
│ - Devis      │              │ - Contacts   │
│ - Factures   │              │ - Companies  │
│ - Templates  │              │ - Pipeline   │
└──────────────┘              └──────────────┘
```

**Setup Twenty:**
```bash
cd ~/Desktop/DEV/twenty/packages/twenty-docker
docker compose up -d
# http://localhost:3000
```

**Endpoints API à utiliser:**
- `GET /companies` - Liste clients
- `GET /people` - Contacts
- `POST /opportunities` - Créer opportunity
- `GET /opportunities` - Pipeline

---

## Briques Prioritaires

| # | Brique | Status | Quick Win |
|---|--------|--------|-----------|
| 1 | Kanban | ✅ Créé | ❌ |
| 2 | Shadcn/ui | ✅ Installé | ❌ |
| 3 | Hot Toast | ✅ Installé | ✅ 5min |
| 4 | PDF luxe | ⏸️ | ❌ |
| 5 | Filters | ⏸️ | ❌ |
| 6 | Twenty API | ⏸️ | ❌ |

---

## Commandes Utiles

```bash
# Installer shadcn
npx shadcn@latest init

# Ajouter composant
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu

# Installer dnd-kit
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Installer form
npm install react-hook-form zod zod-form-data @hookform/resolvers
```

---

## Design System Kwot

### Couleurs
```css
/* Emerald Luxury */
--emerald-50: #ecfdf5;
--emerald-100: #d1fae5;
--emerald-500: #10b981;
--emerald-600: #059669;
--emerald-700: #047857;

/* Dark */
--bg-dark: #0a0a0a;
--bg-card: #121212;
--bg-border: #27272a;
```

### Style
- Glassmorphism sur les cards
- Gradients subtils emerald
- Shadows douces
- Animations Framer Motion

---

## Prochaines Étapes

1. [x] Installer Hot Toast (5min)
2. [x] Ajouter composants Shadcn manquants
3. [x] Créer Kanban (dnd-kit)
4. [ ] Intégrer Kanban dans une page
5. [ ] Améliorer PDF templates
6. [ ] Connecter Twenty API

---

## Utilisation

### Hot Toast
```tsx
import toast from 'react-hot-toast';
import { Providers } from '@/components/Providers';

// Dans votre layout
<Providers>{children}</Providers>

// Usage
toast.success('Devis envoyé !');
toast.error('Erreur lors de l\'envoi');
toast.loading('Envoi en cours...');
```

### Kanban
```tsx
import { KanbanBoard, defaultColumns } from '@/components/KanbanBoard';

const myColumns = defaultColumns.map(col => ({
  ...col,
  cards: quotes.filter(q => q.stage === col.id)
}));

<KanbanBoard 
  columns={myColumns} 
  onCardMove={(cardId, from, to) => console.log(cardId, from, to)}
/>
```

### Shadcn
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
```
