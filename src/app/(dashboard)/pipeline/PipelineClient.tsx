'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { KanbanBoard, defaultColumns, type KanbanCard, type KanbanColumn } from '@/components/KanbanBoard';
import toast from 'react-hot-toast';
import { Search, Filter, X, Users, Euro, Calendar } from 'lucide-react';

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

  // Filters
  const [clientFilter, setClientFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Get unique clients for filter dropdown
  const allClients = useMemo(() => {
    const clients = new Set<string>();
    columns.forEach(col => {
      col.cards.forEach(card => {
        if (card.client) clients.add(card.client);
      });
    });
    return Array.from(clients).sort();
  }, [columns]);

  // Apply filters
  const filteredColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => {
        // Client filter
        if (clientFilter && card.client !== clientFilter) {
          return false;
        }
        // Amount filter
        const amount = card.amount || 0;
        if (amountFilter.min && amount < parseFloat(amountFilter.min)) {
          return false;
        }
        if (amountFilter.max && amount > parseFloat(amountFilter.max)) {
          return false;
        }
        return true;
      }),
    }));
  }, [columns, clientFilter, amountFilter]);

  // Clear filters
  const clearFilters = () => {
    setClientFilter('');
    setAmountFilter({ min: '', max: '' });
  };

  const hasActiveFilters = clientFilter || amountFilter.min || amountFilter.max;

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    const totalQuotes = filteredColumns.reduce((sum, col) => sum + col.cards.length, 0);
    const totalAmount = filteredColumns.reduce((sum, col) => 
      sum + col.cards.reduce((s, card) => s + (card.amount || 0), 0), 0);
    const wonAmount = filteredColumns.find(c => c.id === 'won')?.cards.reduce((sum, card) => sum + (card.amount || 0), 0) || 0;
    const conversionRate = totalQuotes > 0 
      ? Math.round((filteredColumns.find(c => c.id === 'won')?.cards.length || 0) / totalQuotes * 100) 
      : 0;
    return { totalQuotes, totalAmount, wonAmount, conversionRate };
  }, [filteredColumns]);

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Pipeline" subtitle="Gestion des devis" />
      
      <main className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <p className="text-zinc-500 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Total Devis
            </p>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{filteredStats.totalQuotes}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <p className="text-zinc-500 text-sm flex items-center gap-2">
              <Euro className="w-4 h-4" /> Pipeline Total
            </p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{filteredStats.totalAmount.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <p className="text-zinc-500 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Gagnés
            </p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{filteredStats.wonAmount.toLocaleString('fr-FR')}€</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <p className="text-zinc-500 text-sm">Taux de conversion</p>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{filteredStats.conversionRate}%</p>
          </div>
        </div>

        {/* Kanban Container */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          {/* Header & Filters */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Pipeline Devis</h1>
              <p className="text-zinc-500 text-sm">Glissez les devis pour changer leur statut</p>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${showFilters || hasActiveFilters 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}
              `}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {hasActiveFilters && (
                <span className="bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {(!!clientFilter ? 1 : 0) + (!!amountFilter.min ? 1 : 0) + (!!amountFilter.max ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Client Filter */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Client</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Tous les clients</option>
                      {allClients.map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount Filter */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Montant (€)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={amountFilter.min}
                      onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={amountFilter.max}
                      onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Effacer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Kanban Board */}
          <KanbanBoard 
            columns={filteredColumns} 
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
          />
        </div>
      </main>
    </div>
  );
}
