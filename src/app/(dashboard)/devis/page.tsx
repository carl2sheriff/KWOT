"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, ChevronRight, Search } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCard } from "@/components/ui/Loading";

interface QuoteListItem {
  id: string;
  reference: string;
  status: string;
  total: string | number;
  createdAt: string;
  client: { id: string; name: string; company: string | null };
  createdBy: { id: string; name: string };
  project: { id: string; name: string; owner: { id: string; name: string } } | null;
  _count: { items: number };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { value: "", label: "Tous" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "SENT", label: "Envoye" },
  { value: "APPROVED", label: "Approuve" },
  { value: "REJECTED", label: "Refuse" },
];

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DevisPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      const response = await fetch(`/api/quotes?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setQuotes(data.data || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => { setPagination((prev) => ({ ...prev, page: 1 })); }, [search, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Devis"
        subtitle="Gestion des devis"
        actions={
          <Link href="/devis/nouveau">
            <Button variant="accent" size="sm" icon={<Plus size={14} />}>Nouveau devis</Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={[
                  "text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150",
                  statusFilter === filter.value
                    ? "bg-accent text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                ].join(" ")}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
          </div>
        ) : quotes.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Aucun devis"
            description="Creez votre premier devis pour commencer"
            action={<Link href="/devis/nouveau"><Button variant="accent" size="sm" icon={<Plus size={14} />}>Nouveau devis</Button></Link>}
          />
        ) : (
          <>
            <div className="space-y-1.5">
              {quotes.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() => router.push(`/devis/${quote.id}`)}
                  className="w-full bg-surface-raised border border-zinc-800/50 rounded-lg p-4 hover:border-zinc-700 transition-all duration-150 flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100">{quote.reference}</span>
                      {quote.createdBy && (
                        <span className="text-2xs text-zinc-600">par {quote.createdBy.name}</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {quote.client.name}
                      {quote.client.company && <span className="ml-1">({quote.client.company})</span>}
                    </span>
                    <div className="flex items-center gap-2 text-2xs text-zinc-600">
                      <span>{formatDate(quote.createdAt)}</span>
                      <span>·</span>
                      <span>{quote._count.items} article{quote._count.items > 1 ? "s" : ""}</span>
                      {quote.project?.owner && (
                        <>
                          <span>·</span>
                          <span className="text-accent">{quote.project.owner.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 mx-4 flex items-center"><StatusBadge status={quote.status} /></div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base tabular-nums text-zinc-100">{formatCurrency(quote.total)}</span>
                    <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-surface-raised border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >Precedent</button>
                <span className="text-xs text-zinc-500 px-3 tabular-nums">{pagination.page} / {pagination.totalPages}</span>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-surface-raised border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >Suivant</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
