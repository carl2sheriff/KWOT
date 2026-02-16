# Twenty → Kwot: Analyse & Recommandations

## 📊 Structure Twenty

```
twenty/
├── packages/
│   ├── twenty-front/     # React UI (ce qui nous intéresse)
│   │   └── src/modules/
│   │       ├── ui/layout/table/          # Table composants
│   │       ├── object-record/
│   │       │   ├── record-board/          # KANBAN ⭐
│   │       │   ├── object-filter-dropdown/ # Filtres
│   │       │   └── record-table/         # Table data
│   │       └── views/                     # Filtres & tris
│   │
│   └── twenty-server/    # NestJS Backend
│       └── src/modules/
│           ├── opportunity/    # Pipeline ⭐
│           ├── company/        # Clients ⭐
│           └── person/         # Contacts
```

---

## 🔥 CE QUI EST COPY-PASTEABLE (MIT)

### 1. KANBAN / PIPELINE (PRIORITÉ HAUTE)
| Fichier | Description | Difficulté |
|---------|-------------|-------------|
| `record-board/components/RecordBoard.tsx` | Board principal | ⭐⭐ |
| `record-board/components/RecordBoardColumn.tsx` | Colonnes | ⭐ |
| `record-board-card/components/RecordBoardCard.tsx` | Cartes | ⭐ |
| `record-board/hooks/useRecordBoard.ts` | Hook principal | ⭐⭐⭐ |

**Usage Kwot:** Pipeline de devis (Nouveau → Qualifié → Proposition → Signé)

### 2. FILTRES AVANCÉS (PRIORITÉ HAUTE)
| Fichier | Description |
|---------|-------------|
| `object-filter-dropdown/components/*.tsx` | 20+ types de filtres |
| `views/components/ViewBarFilterDropdown.tsx` | UI dropdown filtres |
| `views/hooks/useSaveRecordFiltersToViewFilters.ts` | Logique sauvegarde |

**Usage Kwot:** Filtrer devis par client, statut, montant, date

### 3. TABLE DATA (PRIORITÉ MOYENNE)
| Fichier | Description |
|---------|-------------|
| `ui/layout/table/components/*.tsx` | Table composants |
| `object-record/record-table/components/*.tsx` | Table with sorting/pagination |

**Usage Kwot:** Liste des factures, clients

### 4. DROPDOWNS & UI (PRIORITÉ MOYENNE)
| Fichier | Description |
|---------|-------------|
| `ui/layout/dropdown/*.tsx` | Dropdowns réutilisables |
| `ui/layout/modal/*.tsx` | Modales |
| `ui/layout/resizable-panel/*.tsx` | Panels redimensionnables |

---

## 🏗️ DATA MODEL (可直接用)

### Opportunity (Devis/Projet)
```typescript
interface Opportunity {
  id: string;
  name: string;           // "Dior - S/S 2026"
  amount: number;         // 15000€
  closeDate: Date;        // Date prévue
  stage: string;          // "new" | "proposal" | "won"
  position: number;       // Ordre dans le board
  company: Company;       // Relation client
  pointOfContact: Person; // Contact
  owner: User;            // Responsable commercial
}
```

### Company (Client)
```typescript
interface Company {
  id: string;
  name: string;           // "Dior"
  domainName: string;    // "dior.com"
  annualRecurringRevenue: number;
  employees: number;
  address: Address;
  linkedinLink: string;
}
```

---

## ⚠️ CE QUI NE FONCTIONNE PAS

### Problèmes d'intégration
1. **Emotion** - Twenty utilise `@emotion/styled`, Kwot utilise Tailwind
2. **Context system** - Twenty a un système de context complexe
3. **Recoil** - Twenty utilise Recoil pour le state management
4. **TypeORM custom** - Twenty a son propre wrapper TypeORM

---

## ✅ RECOMMANDATIONS CONCRÈTES

### Phase 1: Copier les concepts (sans code)
- [ ] **Pipeline view** → Design similar pour Kwot
- [ ] **Filter system** → Implémenter from scratch avec Tailwind
- [ ] **Data model** → Utiliser comme référence pour Prisma

### Phase 2: Composants adaptés
- [ ] **Kanban simplifié** → Reconstruire avec Tailwind + dnd-kit
- [ ] **Filter dropdowns** → Tailwind + Headless UI
- [ ] **Table** → TanStack Table + Tailwind

### Phase 3: Intégration Twenty (optionnel)
- [ ] **Docker Twenty** → CRM + Contacts
- [ ] **API Bridge** → Kwot quotes ↔ Twenty opportunities

---

## 📁 FICHIERS COPIÉS

```
kwotmon/src/components/record-board/  ✅ (copié)
```

## 🧪 TEST

Pour tester Twenty:
```bash
cd ~/Desktop/DEV/twenty/packages/twenty-docker
docker-compose up -d
# http://localhost:3000
# teddy@twenty.com / Apple123!
```
