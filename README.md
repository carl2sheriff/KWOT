# KWOT CRM

**CRM Sheriff Projects** - Basé sur le design system de Navigator v1

---

## 🎯 Objectif

CRM moderne pour gérer clients, projets et workflows Sheriff.  
Design identique à Navigator v1 pour intégration future.

---

## 🛠️ Stack Technique

**Framework:** Next.js 15 (App Router)  
**UI:** React 19 + TypeScript 5  
**Styling:** Tailwind CSS 3.4  
**Components:** Shadcn/ui (Radix UI) - à extraire de Navigator  
**Database:** TBD (Supabase? Neon?)  
**Auth:** TBD

---

## 📁 Structure

```
kwot/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # UI components (from Navigator)
│   │   ├── ui/          # Base components
│   │   └── features/    # Feature-specific
│   ├── lib/             # Utils, API, DB
│   ├── types/           # TypeScript types
│   ├── config/          # App configuration
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
├── analysis/            # Navigator v1 analysis docs
└── docs/                # Project documentation
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3000

# Build for production
npm run build
```

---

## 📊 Phase 0: Navigator Analysis

**Status:** 🔄 En cours  
**Sub-agent:** `navigator-analysis` (Gemini)  
**Output:** `analysis/` folder

**Extraction en cours:**
- Design tokens (colors, typography, spacing)
- Components UI (30+ composants)
- Architecture patterns
- Code samples (Sidebar, Header, etc.)

---

## 🗓️ Roadmap

### Phase 0: Analysis (Current)
- [ ] Extract Navigator design system
- [ ] Inventory all UI components
- [ ] Document architecture patterns

### Phase 1: Foundation
- [ ] Setup Next.js + Tailwind (Navigator config)
- [ ] Copy Navigator components to /ui/
- [ ] Setup Supabase/Neon DB

### Phase 2: Core Features
- [ ] Auth system
- [ ] Client management
- [ ] Project management
- [ ] Task/workflow system

### Phase 3: Advanced
- [ ] Analytics dashboard
- [ ] Integrations
- [ ] Mobile responsive
- [ ] Performance optimization

---

## 🎨 Design System

**Source:** Sheriff Navigator v1  
**Docs:** `analysis/NAVIGATOR_DESIGN_TOKENS.md` (pending)

**Principles:**
- Identical look & feel to Navigator
- Reuse 100% of Navigator components
- Consistent spacing, colors, typography
- Same UX patterns (forms, tables, modals)

---

## 👥 Team

**Owner:** Carl Smith-Thomas  
**Agent:** Martin (OpenClaw)  
**Mode:** GSD + Swarm (always)

---

**Status:** 🟢 Active Development  
**Last Update:** 2026-02-10
