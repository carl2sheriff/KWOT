'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { KanbanBoard, defaultColumns, type KanbanCard, type KanbanColumn } from '@/components/KanbanBoard';
import toast from 'react-hot-toast';

interface PipelineQuote {
  id: string;
  title: string;
  client: string;
  amount: number;
  date: string;
  status: string;
}

interface PipelineClientProps {
  initialQuotesByStage: Record<string, PipelineQuote[]>;
  totalAmount: number;
  wonAmount: number;
}

// Stage mapping from DB status to Kanban column
const stageMapping: Record<string, string> = {
  'DRAFT': 'new',
  'SENT': 'proposal',
  'VIEWED': 'negotiation',
  'ACCEPTED': 'won',
  'REJECTED': 'lost',
  'EXPIRED': 'lost',
  'PENDING': 'qualified',
  'NEGOTIATION': 'negotiation',
};

export default function PipelineClient({ 
  initialQuotesByStage, 
  totalAmount: initialTotalAmount,
  wonAmount: initialWonAmount 
}: PipelineClientProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    return defaultColumns.map((col) => ({
      ...col,
      cards: (initialQuotesByStage[stageMapping[col.id] || col.id] || []).map((q: PipelineQuote) => ({
        id: q.id,
        title: q.title || 'Untitled',
        client: q.client,
        amount: q.amount || 0,
        date: q.date,
      })),
    }));
  });

  const [totalAmount] = useState(initialTotalAmount);
  const [wonAmount] = useState(initialWonAmount);

  const handleCardMove = async (cardId: string, fromColumn: string, toColumn: string) => {
    // Map column to status
    const statusMapping: Record<string, string> = {
      'new': 'DRAFT',
      'qualified': 'PENDING',
      'proposal': 'SENT',
      'negotiation': 'NEGOTIATION',
      'won': 'ACCEPTED',
      'lost': 'REJECTED',
    };

    const newStatus = statusMapping[toColumn];
    if (!newStatus) return;

    // Optimistic update - update UI immediately
    setColumns((prev) => {
      let movedCard: KanbanCard | null = null;
      
      // Find and remove card from source
      const newColumns = prev.map((col) => {
        if (col.id === fromColumn) {
          const card = col.cards.find((c) => c.id === cardId);
          if (card) movedCard = card;
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        return col;
      });
      
      // Add card to destination
      if (movedCard) {
        return newColumns.map((col) => {
          if (col.id === toColumn) {
            return { ...col, cards: [...col.cards, movedCard!] };
          }
          return col;
        });
      }
      
      return prev;
    });

    try {
      const res = await fetch(`/api/quotes/${cardId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Devis déplacé vers ${toColumn}`);
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Erreur de connexion');
    }
  };

  const handleCardClick = (card: KanbanCard) => {
    console.log('Clicked card:', card);
    toast(`Ouverture de ${card.title}`, { icon: '📄' });
    // TODO: Navigate to quote detail
  };

  const totalQuotes = columns.reduce((sum, col) => sum + col.cards.length, 0);
  const conversionRate = totalQuotes > 0 
    ? Math.round((columns.find(c => c.id === 'won')?.cards.length || 0) / totalQuotes * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-black">
      <Header title="Pipeline" subtitle="Gestion des devis" />
      
      <main className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-sm">Total Devis</p>
            <p className="text-2xl font-semibold text-zinc-100">{totalQuotes}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-sm">Pipeline Total</p>
            <p className="text-2xl font-semibold text-emerald-400">{totalAmount.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-sm">Gagnés</p>
            <p className="text-2xl font-semibold text-emerald-400">{wonAmount.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-sm">Taux de conversion</p>
            <p className="text-2xl font-semibold text-zinc-100">{conversionRate}%</p>
          </div>
        </div>

        {/* Kanban */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl">
          <div className="p-4 border-b border-zinc-800">
            <h1 className="text-xl font-semibold text-zinc-100">Pipeline Devis</h1>
            <p className="text-zinc-500 text-sm">Glissez les devis pour changer leur statut</p>
          </div>
          
          <KanbanBoard 
            columns={columns} 
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
          />
        </div>
      </main>
    </div>
  );
}
