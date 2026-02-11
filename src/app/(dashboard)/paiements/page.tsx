"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { LoadingCard } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard, Search, ChevronRight } from "lucide-react";

interface PaymentListItem {
  id: string;
  reference: string;
  amount: string | number;
  method: string;
  status: string;
  paidAt: string | null;
  isDeposit: boolean;
  createdAt: string;
  invoice: {
    id: string;
    reference: string;
    client: { id: string; name: string };
  };
  receivedBy: { id: string; name: string };
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

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Virement",
  CHECK: "Cheque",
  CARD: "CB",
  CASH: "Especes",
  OTHER: "Autre",
};

const METHOD_TABS = [
  { key: "", label: "Tous" },
  { key: "BANK_TRANSFER", label: "Virement" },
  { key: "CHECK", label: "Cheque" },
  { key: "CARD", label: "CB" },
  { key: "CASH", label: "Especes" },
];

export default function PaiementsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    totalReceived: 0,
    thisMonth: 0,
    deposits: 0,
    pendingCount: 0,
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (methodFilter) params.set("method", methodFilter);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setPayments(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, methodFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/payments?limit=100");
      const json = await res.json();
      if (json.success) {
        const all: PaymentListItem[] = json.data;
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalReceived = 0;
        let thisMonth = 0;
        let deposits = 0;
        let pendingCount = 0;

        all.forEach((pay) => {
          const amount = toNumber(pay.amount);

          if (pay.status === "COMPLETED") {
            totalReceived += amount;

            if (pay.paidAt && new Date(pay.paidAt) >= firstOfMonth) {
              thisMonth += amount;
            }
          }

          if (pay.isDeposit) {
            deposits++;
          }

          if (pay.status === "PENDING") {
            pendingCount++;
          }
        });

        setStats({ totalReceived, thisMonth, deposits, pendingCount });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
      <Header title="Paiements" subtitle="Suivi des paiements" />

      <div className="flex-1 overflow-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Total recu</div>
            <div className="text-xl font-bold tabular-nums text-success">
              {formatCurrency(stats.totalReceived)}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Ce mois</div>
            <div className="text-xl font-bold tabular-nums text-zinc-100">
              {formatCurrency(stats.thisMonth)}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Acomptes</div>
            <div className="text-xl font-bold tabular-nums text-accent">
              {stats.deposits}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">En attente</div>
            <div className="text-xl font-bold tabular-nums text-warning">
              {stats.pendingCount}
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
            {METHOD_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setMethodFilter(tab.key);
                  setPage(1);
                }}
                className={[
                  "text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150",
                  methodFilter === tab.key
                    ? "bg-accent text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-12 w-12" />}
            title="Aucun paiement"
            description="Aucun paiement ne correspond a vos criteres de recherche."
          />
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_100px_100px_120px_30px] gap-3 text-2xs font-medium text-zinc-600 border-b border-zinc-800/50 pb-2 px-4">
              <div>Reference</div>
              <div>Facture</div>
              <div>Client</div>
              <div>Date</div>
              <div>Methode</div>
              <div className="text-right">Montant</div>
              <div />
            </div>

            {/* Table Rows */}
            {payments.map((pay) => (
              <div
                key={pay.id}
                onClick={() => router.push(`/factures/${pay.invoice.id}`)}
                className="grid grid-cols-[1fr_1fr_1fr_100px_100px_120px_30px] gap-3 items-center py-3 px-4 border-b border-zinc-800/30 cursor-pointer hover:bg-zinc-800/30 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {pay.reference}
                  </div>
                  {pay.isDeposit && (
                    <span className="text-2xs font-medium text-accent">
                      Acompte
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-accent">
                  {pay.invoice.reference}
                </div>
                <div className="text-sm text-zinc-300 truncate">
                  {pay.invoice.client.name}
                </div>
                <div className="text-xs text-zinc-400">
                  {pay.paidAt ? formatDate(pay.paidAt) : "-"}
                </div>
                <div>
                  <span className="px-2 py-0.5 text-2xs font-medium border border-zinc-700 rounded-md text-zinc-400">
                    {METHOD_LABELS[pay.method] || pay.method}
                  </span>
                </div>
                <div className="text-right text-sm font-bold tabular-nums text-zinc-100">
                  {formatCurrency(pay.amount)}
                </div>
                <div className="flex items-center justify-center">
                  <ChevronRight size={14} className="text-zinc-700" />
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                <div className="text-xs text-zinc-500">
                  {pagination.total} paiement{pagination.total > 1 ? "s" : ""} — Page{" "}
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
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
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
