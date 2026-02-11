"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { LoadingCard } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { FileX2, Plus, ChevronRight, Search } from "lucide-react";

interface CreditNoteListItem {
  id: string;
  reference: string;
  status: string;
  issueDate: string;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
  reason: string;
  invoice: { id: string; reference: string } | null;
  client: { id: string; name: string; company: string | null };
  createdBy: { id: string; name: string };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR");
}

function toNumber(val: string | number): number {
  return typeof val === "string" ? parseFloat(val) : val;
}

const STATUS_TABS = [
  { key: "", label: "Tous" },
  { key: "DRAFT", label: "Brouillon" },
  { key: "SENT", label: "Envoye" },
  { key: "APPLIED", label: "Applique" },
];

export default function AvoirsPage() {
  const router = useRouter();
  const [creditNotes, setCreditNotes] = useState<CreditNoteListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    draftCount: 0,
    appliedCount: 0,
  });

  const fetchCreditNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/credit-notes?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setCreditNotes(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch credit notes:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/credit-notes?limit=100");
      const json = await res.json();
      if (json.success) {
        const all: CreditNoteListItem[] = json.data;

        let totalAmount = 0;
        let draftCount = 0;
        let appliedCount = 0;

        all.forEach((cn) => {
          totalAmount += toNumber(cn.total);
          if (cn.status === "DRAFT") draftCount++;
          if (cn.status === "APPLIED") appliedCount++;
        });

        setStats({
          totalCount: all.length,
          totalAmount,
          draftCount,
          appliedCount,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Avoirs"
        subtitle="Gestion des avoirs"
        actions={
          <Button
            variant="accent"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => router.push("/avoirs/nouveau")}
          >
            Nouvel avoir
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Total avoirs</div>
            <div className="text-xl font-bold tabular-nums text-zinc-100">
              {stats.totalCount}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Montant total</div>
            <div className="text-xl font-bold tabular-nums text-zinc-100">
              {formatCurrency(stats.totalAmount)}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Brouillons</div>
            <div className="text-xl font-bold tabular-nums text-warning">
              {stats.draftCount}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Appliques</div>
            <div className="text-xl font-bold tabular-nums text-success">
              {stats.appliedCount}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>
          <div className="flex items-center gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={[
                  "text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150",
                  statusFilter === tab.key
                    ? "bg-accent text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Credit Notes List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : creditNotes.length === 0 ? (
          <EmptyState
            icon={<FileX2 className="h-12 w-12" />}
            title="Aucun avoir"
            description="Aucun avoir ne correspond a vos criteres de recherche."
            action={
              <Button
                variant="accent"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => router.push("/avoirs/nouveau")}
              >
                Creer un avoir
              </Button>
            }
          />
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_1.2fr_100px_90px_120px_30px] gap-3 text-2xs font-medium text-zinc-600 border-b border-zinc-800/50 pb-2 px-4">
              <div>Reference</div>
              <div>Facture d&apos;origine</div>
              <div>Client</div>
              <div>Date emission</div>
              <div>Statut</div>
              <div className="text-right">Total</div>
              <div />
            </div>

            {/* Table Rows */}
            {creditNotes.map((cn) => {
              const total = toNumber(cn.total);

              return (
                <div
                  key={cn.id}
                  onClick={() => router.push(`/avoirs/${cn.id}`)}
                  className="grid grid-cols-[1fr_1fr_1.2fr_100px_90px_120px_30px] gap-3 items-center py-3 px-4 border-b border-zinc-800/30 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="text-sm font-semibold text-zinc-100">
                    {cn.reference}
                  </div>
                  <div className="text-sm text-zinc-400 truncate">
                    {cn.invoice ? cn.invoice.reference : "—"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200 truncate">
                      {cn.client.name}
                    </div>
                    {cn.client.company && (
                      <div className="text-2xs text-zinc-500 truncate">
                        {cn.client.company}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {formatDate(cn.issueDate)}
                  </div>
                  <div>
                    <StatusBadge status={cn.status} />
                  </div>
                  <div className="text-right text-sm font-bold tabular-nums text-zinc-100">
                    {formatCurrency(total)}
                  </div>
                  <div className="flex justify-center">
                    <ChevronRight size={14} className="text-zinc-700" />
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                <div className="text-xs text-zinc-500">
                  {pagination.total} avoir{pagination.total > 1 ? "s" : ""} — Page{" "}
                  {pagination.page} / {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="text-xs font-medium px-3 py-1.5 rounded-md bg-surface-raised border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Precedent
                  </button>
                  <button
                    onClick={() =>
                      setPage(Math.min(pagination.totalPages, page + 1))
                    }
                    disabled={page >= pagination.totalPages}
                    className="text-xs font-medium px-3 py-1.5 rounded-md bg-surface-raised border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
