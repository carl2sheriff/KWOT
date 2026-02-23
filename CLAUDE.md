# CLAUDE.md - Kwot

## Project Overview
- **Type**: Quote management app with CRM features
- **Tech Stack**: Next.js 15, Prisma, Tailwind, TypeScript
- **Port**: 3002

## Conventions

### Naming
- Components: PascalCase (e.g., `QuoteCard.tsx`)
- Utils/functions: camelCase
- Database: snake_case (Prisma default)

### CSV Import
- Format: `name;description;price;category;unit` (semicolon delimited)
- Use papaparse for parsing
- Endpoint: `/api/products/import`

## Known Issues (NEVER DO)

- ❌ Don't use middleware.ts in Next.js 16 - use proxy config instead
- ❌ Don't use deprecated sentry.client.config.ts - use instrumentation-client.ts

## Architecture Rules

- API routes in `/app/api/`
- Components in `/app/components/`
- Prisma schema in `/prisma/schema.prisma`
- Mobile-first design

## Constraints

- Zero crash tolerance in production
- Mobile-first design required
- Production-grade quality

---

*Last updated: 2026-02-17*
