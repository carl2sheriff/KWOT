# CLAUDE.md - KWOT Finance

## Project Overview

KWOT Finance is a CRM financier (financial CRM) built for **Sheriff Projects**, a photo/video production company. It handles the full financial lifecycle: clients, projects, quotes (devis), invoices (factures), payments, credit notes (avoirs), purchase orders, and product catalogue management.

The app is designed with a dark theme inspired by Navigator v1 (the company's existing project management tool). KWOT Finance receives project data from Navigator v1 via webhooks and handles all financial operations independently.

**Language**: The UI is entirely in French. Status labels, validation messages, legal mentions, and navigation are all in French. Code (variables, comments) is in English.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS 3 with custom design tokens (dark theme)
- **Database**: PostgreSQL via Neon (serverless), managed with Prisma ORM 6.x
- **Validation**: Zod 4.x for request body validation
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Email**: Resend
- **Charts**: Recharts 3.x (dashboard)
- **Icons**: Lucide React
- **Toast Notifications**: Sonner
- **Font**: Inter (sans), JetBrains Mono (mono)
- **Node**: >= 18.17.0

## Development Commands

**IMPORTANT**: On this machine, always prefix npm/npx commands with the PATH export:

```bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/bin:/usr/bin:$PATH"
```

### Common commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript check (tsc --noEmit)
```

### Prisma commands

```bash
npx prisma db push       # Push schema to database (no migration files)
npx prisma generate      # Regenerate Prisma Client after schema changes
npx prisma migrate dev   # Create and apply migration
npx prisma studio        # Visual database browser
```

## Project Structure

```
src/
  app/
    (dashboard)/             # Main layout with Sidebar + ToastProvider + ConfirmProvider
      page.tsx               # Dashboard (Tableau de bord)
      clients/               # Client CRUD pages
      projets/               # Project pages
      devis/                 # Quote pages (list, create, detail)
      factures/              # Invoice pages
      paiements/             # Payment list
      avoirs/                # Credit notes list
      purchase-orders/       # Purchase order pages
      catalogue/             # Product catalogue
      settings/              # Company settings
    api/
      clients/               # GET (list), POST (create)
        [id]/                # GET, PUT, DELETE
      projects/              # GET, POST
        [id]/                # GET, PUT, DELETE
          timeline/          # GET - Project activity timeline
      quotes/                # GET, POST
        [id]/                # GET, PUT, DELETE
          approve/           # POST - Status change to APPROVED
          convert/           # POST - Convert quote to invoice
          situation/         # POST - Create situation invoice from milestone
          pdf/               # GET - Generate PDF
          send/              # POST - Send by email
      invoices/              # GET, POST
        [id]/                # GET, PUT, DELETE
          pdf/               # GET - Generate PDF
          send/              # POST - Send by email
      credit-notes/          # GET, POST
        [id]/                # GET, PUT, DELETE
      payments/              # GET, POST
        [id]/                # GET, PUT, DELETE
      purchase-orders/       # GET, POST
        [id]/                # GET, PUT, DELETE
      suppliers/             # GET, POST
        [id]/                # GET, PUT, DELETE
      dashboard/stats/       # GET - Dashboard financial stats
      settings/company/      # GET, PUT - Company settings (singleton)
      webhooks/navigator/    # POST - Navigator v1 webhook receiver
  components/
    layout/
      Sidebar.tsx            # Fixed left sidebar (240px) with nav sections
      Header.tsx             # Page header component
    ui/                      # Design system primitives
      Button.tsx, Input.tsx, Select.tsx, Textarea.tsx, Label.tsx
      Badge.tsx, Modal.tsx, Toast.tsx, ConfirmModal.tsx
      Loading.tsx, EmptyState.tsx, Stepper.tsx
      Breadcrumb.tsx, Tooltip.tsx, ActivityTimeline.tsx
    financial/               # Domain-specific components
      ClientSelector.tsx     # Client dropdown with search
      LineItemsEditor.tsx    # Editable line items table
      MilestoneEditor.tsx    # Milestone/situation editor
      TotalsSummary.tsx      # Subtotal/tax/discount/total display
      StatusBadge.tsx        # Color-coded status badge
      PaymentProgress.tsx    # Payment progress bar
      AmountDisplay.tsx      # Currency formatted amount
      FinancialCard.tsx      # Dashboard stat card
      DateRangePicker.tsx    # Date range filter
  lib/
    db.ts                    # Prisma Client singleton
    api-middleware.ts         # API wrapper, response helpers, pagination
    schemas.ts               # Zod validation schemas for all entities
    numbering.ts             # Reference generation, currency formatting, financial calculations
    format.ts                # Date formatting, status labels (FR), legal mentions
    audit.ts                 # Audit log creation and diff helper
  types/
    index.ts                 # Re-exports Prisma types + API response types + filter types
prisma/
  schema.prisma              # Full database schema
  migrations/                # Migration files
```

## Architecture Patterns

### API Middleware

All API routes use `withApiMiddleware()` which provides:
- Try/catch error handling with consistent error responses
- Future auth hooks (currently stubbed)

```typescript
export const GET = withApiMiddleware(async (req: NextRequest, context) => {
  // handler code
})
```

### API Response Format

All responses follow this structure:

```json
// Success
{ "success": true, "data": {...}, "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }

// Error
{ "success": false, "error": "Message", "details": {...} }
```

Use `apiSuccess(data, pagination?)` and `apiError(message, status, details?)`.

### TEMP_USER_ID

Every API route that creates entities uses a hardcoded UUID:

```typescript
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001'
```

This is because authentication is not yet implemented. The user is upserted in the webhook handler. When adding auth, replace `TEMP_USER_ID` with the authenticated user's ID from the session.

### Pagination

```typescript
const { page, limit, skip } = parsePagination(searchParams)  // from query string
const pagination = buildPagination(page, limit, total)        // for response
```

Default: page=1, limit=20, max=100.

### Validation with Zod

Request bodies are validated with Zod schemas from `src/lib/schemas.ts`:

```typescript
const parsed = createQuoteSchema.safeParse(body)
if (!parsed.success) return apiError('Donnees invalides', 400, parsed.error.flatten())
```

### Financial Calculations (`src/lib/numbering.ts`)

- `calculateItemTotal(quantity, unitPrice, discount)` - Line item HT (before tax)
- `calculateTotals(items, defaultTaxRate, globalDiscount, discountType)` - Full document totals with multi-TVA support
- Returns `{ subtotal, taxAmount, total, discountAmount, taxBreakdown }` where taxBreakdown groups by rate
- All calculations use `Math.round(x * 100) / 100` for 2-decimal precision

### Reference Generation (`generateReference`)

Format: `PREFIX-YYYY-NNNN` (e.g., `DEV-2026-0001`, `FAC-2026-0042`)

- Uses atomic Prisma transaction to increment counters
- Counters auto-reset when the year changes
- Prefixes are configurable in CompanySettings: DEV (quotes), FAC (invoices), AV (credit notes), PO (purchase orders), PAY (payments)

### Audit Logging

Every create/update/delete/status-change operation logs to the `audit_logs` table:

```typescript
await createAuditLog({
  userId: TEMP_USER_ID,
  action: 'CREATE',           // CREATE | UPDATE | DELETE | STATUS_CHANGE | APPROVE | REJECT | SEND | PAYMENT | CREDIT
  entityType: 'quote',        // client | project | quote | invoice | credit_note | payment | purchase_order
  entityId: record.id,
  changes: diffChanges(oldData, newData),  // optional
  metadata: { reference: '...' },          // optional
})
```

### Dashboard Layout

The `(dashboard)` route group wraps all pages with:
- `ToastProvider` (sonner-based)
- `ConfirmProvider` (confirmation modal context)
- `Sidebar` (fixed 240px left) + `main` content area

## Database Schema Overview

### Core Models

| Model | Table | Description |
|-------|-------|-------------|
| User | `users` | User accounts (admin/manager/user roles) |
| Client | `clients` | Clients with optional Navigator v1 link |
| Contact | `contacts` | Client contacts (cascade delete) |
| Project | `projects` | Projects linked to client + optional Navigator sync |
| Task | `tasks` | Project tasks (todo/in_progress/done) |
| Note | `notes` | Activity notes (polymorphic via entityType+entityId) |

### Financial Models

| Model | Table | Description |
|-------|-------|-------------|
| Quote | `quotes` | Devis with versioning, milestones, status workflow |
| QuoteItem | `quote_items` | Line items with per-item tax rate |
| QuoteVersion | `quote_versions` | JSON snapshots of quote changes |
| QuoteMilestone | `quote_milestones` | Situation invoicing milestones (label + percentage) |
| Invoice | `invoices` | Factures with payment tracking (amountPaid/amountDue) |
| InvoiceItem | `invoice_items` | Line items |
| CreditNote | `credit_notes` | Avoirs linked to an invoice |
| CreditNoteItem | `credit_note_items` | Credit note line items |
| Payment | `payments` | Individual payments against an invoice |
| PaymentSchedule | `payment_schedules` | Installment schedule for an invoice |
| PurchaseOrder | `purchase_orders` | Bons de commande to suppliers |
| PurchaseOrderItem | `purchase_order_items` | PO line items |

### Catalogue & Other

| Model | Table | Description |
|-------|-------|-------------|
| Product | `products` | SKU, price, cost, taxRate, stock, specifications (JSON) |
| ProductCategory | `product_categories` | Hierarchical categories (self-referencing) |
| ProjectProduct | `project_products` | Junction table: products assigned to projects |
| Supplier | `suppliers` | Supplier companies |
| AuditLog | `audit_logs` | Full audit trail |
| CompanySettings | `company_settings` | Singleton: company info, prefixes, counters, legal info |

### Enums

- `QuoteStatus`: DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CANCELLED
- `InvoiceStatus`: DRAFT, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED, CREDITED
- `CreditNoteStatus`: DRAFT, SENT, APPLIED
- `PaymentMethod`: BANK_TRANSFER, CHECK, CARD, CASH, OTHER
- `PaymentStatus`: PENDING, COMPLETED, FAILED, REFUNDED
- `POStatus`: DRAFT, SENT, CONFIRMED, RECEIVED, CANCELLED
- `AuditAction`: CREATE, UPDATE, DELETE, STATUS_CHANGE, APPROVE, REJECT, SEND, PAYMENT, CREDIT
- `DiscountType`: PERCENTAGE, FIXED

### Key Schema Details

- All IDs are UUIDs (`@db.Uuid`)
- All monetary fields use `Decimal(12, 2)`
- Column names use snake_case in the database (`@map`), camelCase in Prisma
- `navigatorId` fields on Client and Project enable Navigator v1 sync
- `CompanySettings` is a singleton row with all document counters and company legal info

## Feature Modules

### Clients (`/clients`)
- **Pages**: `src/app/(dashboard)/clients/page.tsx`, `nouveau/page.tsx`, `[id]/page.tsx`
- **API**: `src/app/api/clients/route.ts`, `[id]/route.ts`
- Statuses: active, inactive, prospect

### Projects (`/projets`)
- **Pages**: `src/app/(dashboard)/projets/page.tsx`, `nouveau/page.tsx`, `[id]/page.tsx`
- **API**: `src/app/api/projects/route.ts`, `[id]/route.ts`, `[id]/timeline/route.ts`
- Navigator v1 sync via `navigatorId` and `navigatorRef`

### Quotes / Devis (`/devis`)
- **Pages**: `src/app/(dashboard)/devis/page.tsx`, `nouveau/page.tsx`, `[id]/page.tsx`
- **API**: `src/app/api/quotes/route.ts`, `[id]/route.ts`, `[id]/approve/route.ts`, `[id]/convert/route.ts`, `[id]/situation/route.ts`, `[id]/pdf/route.ts`, `[id]/send/route.ts`
- Supports versioning, milestones, per-item tax rates, sections

### Invoices / Factures (`/factures`)
- **Pages**: `src/app/(dashboard)/factures/page.tsx`, `nouveau/page.tsx`, `[id]/page.tsx`
- **API**: `src/app/api/invoices/route.ts`, `[id]/route.ts`, `[id]/pdf/route.ts`, `[id]/send/route.ts`
- Tracks amountPaid/amountDue, supports situation invoicing

### Payments / Paiements (`/paiements`)
- **Pages**: `src/app/(dashboard)/paiements/page.tsx`
- **API**: `src/app/api/payments/route.ts`, `[id]/route.ts`

### Credit Notes / Avoirs (`/avoirs`)
- **Pages**: `src/app/(dashboard)/avoirs/page.tsx`
- **API**: `src/app/api/credit-notes/route.ts`, `[id]/route.ts`

### Purchase Orders / Bons de Commande (`/purchase-orders`)
- **Pages**: `src/app/(dashboard)/purchase-orders/page.tsx`, `nouveau/page.tsx`, `[id]/page.tsx`
- **API**: `src/app/api/purchase-orders/route.ts`, `[id]/route.ts`

### Suppliers / Fournisseurs
- **API**: `src/app/api/suppliers/route.ts`, `[id]/route.ts`
- Used by purchase orders

### Product Catalogue (`/catalogue`)
- **Pages**: `src/app/(dashboard)/catalogue/page.tsx`
- Hierarchical categories, SKU-based products

### Dashboard (`/`)
- **Pages**: `src/app/(dashboard)/page.tsx`
- **API**: `src/app/api/dashboard/stats/route.ts`
- Financial stats: revenue MTD/YTD, outstanding invoices, overdue amounts, conversion rate

### Company Settings (`/settings`)
- **Pages**: `src/app/(dashboard)/settings/page.tsx`
- **API**: `src/app/api/settings/company/route.ts`
- Company legal info, document prefixes, counters, payment terms, tax rates

### Navigator v1 Webhook Sync
- **API**: `src/app/api/webhooks/navigator/route.ts`
- Receives `project.created` and `project.updated` events
- Auto-creates clients and projects in KWOT
- Authenticated via `x-webhook-secret` header

### PDF Generation
- **API**: `src/app/api/quotes/[id]/pdf/route.ts`, `src/app/api/invoices/[id]/pdf/route.ts`
- Uses jsPDF + jsPDF-AutoTable
- Includes company legal mentions (French law requirements)

### Email Sending
- **API**: `src/app/api/quotes/[id]/send/route.ts`, `src/app/api/invoices/[id]/send/route.ts`
- Uses Resend API

## UI Design System

### Color Tokens (defined in `tailwind.config.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| `surface` | `#09090B` | Main background |
| `surface-raised` | `#18181B` | Cards, sidebar |
| `surface-overlay` | `#27272A` | Modals, dropdowns |
| `surface-subtle` | `#1C1C1F` | Subtle backgrounds |
| `accent` | `#8B5CF6` | Primary action color (violet) |
| `accent-hover` | `#7C3AED` | Hover state |
| `accent-muted` | `rgba(139,92,246,0.12)` | Light accent background |
| `success` | `#10B981` | Paid, approved, active |
| `warning` | `#F59E0B` | Pending, sent |
| `danger` | `#F43F5E` | Overdue, rejected, errors |
| `info` | `#3B82F6` | Informational |

### Typography

Custom font sizes (smaller than Tailwind defaults):
- `text-2xs`: 0.625rem (10px) - Labels, version numbers
- `text-xs`: 0.6875rem (11px) - Secondary text
- `text-sm`: 0.8125rem (13px) - Body text, nav items
- `text-base`: 0.875rem (14px) - Default
- `text-lg`: 1rem (16px)

### Animations

- `animate-fade-in`, `animate-slide-up`, `animate-slide-in-right`, `animate-scale-in`, `animate-shimmer`

### Shadows

- `shadow-glow` (accent glow), `shadow-card`, `shadow-card-hover`, `shadow-modal`

### Component Patterns

- **Header** (`src/components/layout/Header.tsx`): Page title + optional action buttons
- **Button** (`src/components/ui/Button.tsx`): Variants (primary, secondary, ghost, danger, outline)
- **StatusBadge** (`src/components/financial/StatusBadge.tsx`): Color-coded status display using `getStatusVariant()` from `format.ts`
- **EmptyState** (`src/components/ui/EmptyState.tsx`): Empty list placeholder with icon + CTA
- **Loading** (`src/components/ui/Loading.tsx`): Skeleton/spinner states
- **Toast**: Via `sonner` library, wrapped in `ToastProvider`
- **ConfirmModal** (`src/components/ui/ConfirmModal.tsx`): Confirmation dialog via React context
- **LineItemsEditor** (`src/components/financial/LineItemsEditor.tsx`): Reusable editable table for quote/invoice items
- **MilestoneEditor** (`src/components/financial/MilestoneEditor.tsx`): Milestone percentage editor for situation invoicing

### Dark Theme Classes

- Borders: `border-zinc-800/50`
- Text: `text-zinc-100` (primary), `text-zinc-400` (secondary), `text-zinc-600` (muted labels)
- Active nav: `bg-accent/10 text-accent`
- Hover: `hover:bg-zinc-800/50 hover:text-zinc-200`
- Logo uses `.text-gradient` CSS class

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://...@....neon.tech/kwot?sslmode=require

# Required for Navigator v1 sync
NAVIGATOR_WEBHOOK_SECRET=your-secret

# Optional - Email sending
RESEND_API_KEY=re_...
EMAIL_FROM=KWOT Finance <finance@yourdomain.com>

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Business Logic

### Quote to Invoice Conversion

1. Quote must be in `APPROVED` status
2. `POST /api/quotes/[id]/convert` creates an invoice copying all items
3. Invoice starts as `DRAFT`, due date = today + defaultPaymentTerms
4. One-to-one: a quote can only be converted once (checked via `invoices` relation)

### Situation Invoicing (Facturation de Situation)

1. Quotes can have milestones (e.g., "Acompte commande 30%", "Fin tournage 40%", "Livraison 30%")
2. `POST /api/quotes/[id]/situation` with `{ milestoneId }` creates a proportional invoice
3. Each item's quantity and discount are scaled by the milestone percentage
4. `situationNumber` tracks which situation this is (1/3, 2/3, etc.)
5. Each milestone can only be invoiced once (tracked via `milestone.invoiceId`)

### Payment Tracking

- Each payment records amount, method, status against an invoice
- When a payment is recorded, the invoice's `amountPaid` and `amountDue` are updated
- Invoice status transitions: DRAFT -> SENT -> PARTIALLY_PAID -> PAID
- If total credit notes + payments >= invoice total, status can become CREDITED

### Credit Note Application

- Credit notes are always linked to a specific invoice
- When applied, the credit amount reduces the invoice's outstanding balance
- Status flow: DRAFT -> SENT -> APPLIED

### Yearly Counter Reset

- The `counterYear` field in CompanySettings tracks the current year
- When `generateReference()` detects a year change, ALL counters reset to 1
- This ensures references follow French accounting conventions (FAC-2026-0001 restarts each year)

### Navigator v1 Webhook Sync

- Webhook endpoint: `POST /api/webhooks/navigator`
- Auth: `x-webhook-secret` header must match `NAVIGATOR_WEBHOOK_SECRET`
- Events: `project.created`, `project.updated`
- Creates/updates clients and projects in KWOT, storing Navigator IDs for deduplication
- Fields mapped: nom, numero, type, statut, dates, budget, client, BU, responsable

### French Legal Compliance

- `generateLegalMentions()` in `format.ts` produces mandatory invoice footer text
- Includes: payment terms, late penalty rate (default 12%), recovery fee (40 EUR), early payment discount
- Company settings store: SIRET, SIREN, RCS, TVA intracommunautaire, APE code

## Known Limitations

1. **No authentication**: All routes use `TEMP_USER_ID`. Auth middleware is stubbed but not implemented.
2. **No test suite**: No unit or integration tests exist.
3. **PDF font limitations**: jsPDF uses Helvetica which has limited French character support (accented characters may not render perfectly).
4. **Single currency**: Hard-coded to EUR/fr-FR although the settings model supports configuration.
5. **No file uploads**: Receipt URLs for expenses are stored as strings but there is no upload mechanism.
6. **No real-time updates**: No WebSocket or polling for collaborative editing.
7. **Time tracking and Expenses**: Models exist in the schema but no dedicated UI pages yet.
