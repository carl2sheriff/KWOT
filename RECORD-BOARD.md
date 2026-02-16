# Record Board - Intégration Kwot

## Fichiers copiés
```
kwotmon/src/components/record-board/
```

## Dépendances à installer
```bash
cd ~/Desktop/DEV/kwotmon
npm install @emotion/react @emotion/styled
```

## Utilisation basique

### 1. Import
```tsx
import { RecordBoard } from '@/components/record-board/components/RecordBoard';
```

### 2. Exemple simple
```tsx
const columns = [
  { id: 'new', title: 'Nouveau' },
  { id: 'qualified', title: 'Qualifié' },
  { id: 'proposal', title: 'Proposition' },
  { id: 'won', title: 'Gagné' },
];

const cards = [
  { id: '1', columnId: 'new', title: 'Dior - Campaign S/S 2026' },
  { id: '2', columnId: 'proposal', title: 'Chanel - Lookbook' },
];

<RecordBoard
  columns={columns}
  cards={cards}
  onCardMove={(cardId, newColumnId) => {
    console.log(cardId, newColumnId);
  }}
/>
```

## Personnalisation

- **Style**: Modifier les fichiers dans `record-board/components/`
- **Theme**: Twenty utilise Emotion - adapter au theme Kwot
- **Drag & Drop**: Déjà inclus (react-beautiful-dnd ou similaire)

## Note
Les composants Twenty utilisent leur propre système de hooks et context. Il faudra peut-être créer des adaptateurs pour Kwot.
