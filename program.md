# KWOT — Sheriff CRM | Agent Program

## Mission

Build **KWOT**, the Sheriff internal CRM, as a standalone Next.js application that visually and architecturally mirrors **Sheriff Navigator v1**. KWOT manages the full client lifecycle: contacts, companies, deals, projects, invoices, and activity tracking.

## Metric

Success = a fully functional CRM where:
- UI is indistinguishable from Navigator in look & feel
- All CRUD operations work end-to-end
- Navigation, forms, tables, and feedback patterns match Navigator exactly

## Stack (aligned with Navigator)

```
framework:        Next.js 14 (App Router)
language:         TypeScript (strict)
styling:          Tailwind CSS 3.4
components:       shadcn/ui (Radix primitives)
forms:            React Hook Form + Zod
state:            Zustand (client), Server Components (server)
data-fetching:    Server Actions + TanStack Query
database:         Supabase (PostgreSQL + Auth + Storage)
icons:            Lucide React
date:             date-fns
tables:           TanStack Table
charts:           Recharts
toasts:           Sonner
deployment:       Vercel
```

## Design System (Navigator-aligned)

### Colors
```
brand-primary:    #E85D2A (Sheriff orange)
brand-dark:       #2D1B14 (dark brown/header)
background:       #FFFFFF (body), #FAFAFA (cards), #F5F5F5 (sidebar)
text-primary:     #1A1A1A
text-secondary:   #6B7280
text-muted:       #9CA3AF
border:           #E5E7EB
success:          #22C55E
error:            #EF4444
warning:          #F59E0B
info:             #3B82F6
```

### Typography
```
font-family:      Inter (sans), JetBrains Mono (mono)
font-sizes:       xs(12) sm(14) base(16) lg(18) xl(20) 2xl(24) 3xl(30) 4xl(36)
font-weights:     normal(400) medium(500) semibold(600) bold(700)
```

### Spacing & Radius
```
spacing:          Tailwind default (4px base)
radius:           sm(4) md(6) lg(8) xl(12) 2xl(16) full(9999)
container:        max-w-7xl (1280px)
sidebar-width:    260px (collapsible to 64px)
header-height:    64px
```

## Architecture

```
kwot/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + Header wrapper
│   │   ├── page.tsx                # Dashboard home
│   │   ├── contacts/
│   │   │   ├── page.tsx            # Contacts list
│   │   │   ├── [id]/page.tsx       # Contact detail
│   │   │   └── new/page.tsx        # New contact
│   │   ├── companies/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── deals/
│   │   │   ├── page.tsx            # Pipeline / Kanban view
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── activities/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── profile/page.tsx
│   │       └── team/page.tsx
│   ├── api/
│   │   └── (reserved for webhooks)
│   ├── layout.tsx                  # Root layout
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── breadcrumbs.tsx
│   ├── contacts/                   # Feature components
│   ├── companies/
│   ├── deals/
│   ├── projects/
│   ├── invoices/
│   └── shared/                     # Shared feature components
│       ├── data-table.tsx
│       ├── stats-card.tsx
│       ├── empty-state.tsx
│       └── page-header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── actions/                    # Server Actions
│   │   ├── contacts.ts
│   │   ├── companies.ts
│   │   ├── deals.ts
│   │   └── ...
│   ├── validations/                # Zod schemas
│   │   ├── contact.ts
│   │   ├── company.ts
│   │   ├── deal.ts
│   │   └── ...
│   ├── hooks/                      # Custom React hooks
│   └── utils.ts                    # cn(), formatDate, formatCurrency...
├── types/
│   ├── database.ts                 # Supabase generated types
│   ├── contact.ts
│   ├── company.ts
│   ├── deal.ts
│   └── index.ts
├── config/
│   ├── navigation.ts               # Sidebar menu items
│   └── site.ts                     # Site metadata
├── public/
│   └── logo.svg
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
├── package.json
└── program.md                       # THIS FILE
```

## Conventions

```
components:       PascalCase (UserCard.tsx)
files/folders:    kebab-case (user-profile.ts, contacts/)
variables/funcs:  camelCase
constants:        UPPER_SNAKE_CASE
types:            PascalCase, prefer `interface` over `type`
db tables:        snake_case (user_profiles)
exports:          named exports (no default exports)
patterns:         function declarations (not arrow for components)
```

## CRM Data Model

```sql
-- Core entities
contacts          (id, first_name, last_name, email, phone, company_id, position, notes, avatar_url, created_at, updated_at)
companies         (id, name, domain, industry, size, logo_url, address, city, country, notes, created_at, updated_at)
deals             (id, title, value, currency, stage, probability, contact_id, company_id, owner_id, expected_close_date, closed_at, notes, created_at, updated_at)
projects          (id, title, description, status, company_id, deal_id, start_date, end_date, budget, created_at, updated_at)
invoices          (id, number, project_id, company_id, amount, currency, status, due_date, paid_at, created_at, updated_at)
activities        (id, type, title, description, contact_id, company_id, deal_id, project_id, user_id, scheduled_at, completed_at, created_at)
users             (managed by Supabase Auth, extended with profiles table)
profiles          (id, user_id, full_name, avatar_url, role, created_at, updated_at)

-- Deal stages
enum: lead, qualified, proposal, negotiation, won, lost

-- Activity types
enum: call, email, meeting, note, task

-- Invoice status
enum: draft, sent, paid, overdue, cancelled

-- Project status
enum: planning, active, on_hold, completed, cancelled
```

## Development Loop

Each iteration:
1. Pick the next incomplete feature from the roadmap
2. Implement it (components + server actions + validation + types)
3. Ensure it matches Navigator's visual style
4. Test it works
5. Commit with clear message
6. Move to next feature

## Roadmap (ordered)

- [x] Phase 0: program.md + project scaffold
- [ ] Phase 1: Auth (login page, Supabase auth, middleware)
- [ ] Phase 2: Layout (sidebar, header, breadcrumbs)
- [ ] Phase 3: Dashboard (stats cards, recent activity, charts)
- [ ] Phase 4: Contacts CRUD (list + detail + forms)
- [ ] Phase 5: Companies CRUD
- [ ] Phase 6: Deals pipeline (kanban + list views)
- [ ] Phase 7: Projects CRUD
- [ ] Phase 8: Invoices CRUD
- [ ] Phase 9: Activities & timeline
- [ ] Phase 10: Settings (profile, team)
- [ ] Phase 11: Search (CMD+K), notifications
- [ ] Phase 12: Polish, responsive, dark mode
