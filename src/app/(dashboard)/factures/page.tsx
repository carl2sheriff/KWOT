"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Loading, LoadingCard } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { Receipt, Plus, AlertCircle, ChevronRight, Search } from "lucide-react";

interface InvoiceListItem {
  id: string;
  reference: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: string | number;
  amountPaid: string | number;
  amountDue: string | number;
  client: { id: string; name: string; company: string | null };
  createdBy: { id: string; name: string };
  _count: { items: number; payments: number };
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
  { key: "PAID", label: "Paye" },
  { key: "OVERDUE", label: "En retard" },
  { key: "CANCELLED", label: "Annule" },
];

export default function FacturesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidCount: 0,
  });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter === "OVERDUE") {
        params.set("overdue", "true");
      } else if (statusFilter) {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setInvoices(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices?limit=100");
      const json = await res.json();
      if (json.success) {
        const all: InvoiceListItem[] = json.data;
        const now = new Date();

        let totalAmount = 0;
        let pendingAmount = 0;
        let overdueAmount = 0;
        let paidCount = 0;

        all.forEach((inv) => {
          const total = toNumber(inv.total);
          const due = toNumber(inv.amountDue);
          totalAmount += total;

          if (inv.status === "PAID") {
            paidCount++;
          }

          if (
            inv.status !== "PAID" &&
            inv.status !== "CANCELLED" &&
            inv.status !== "CREDITED"
          ) {
            pendingAmount += due;

            if (new Date(inv.dueDate) < now) {
              overdueAmount += due;
            }
          }
        });

        setStats({ totalAmount, pendingAmount, overdueAmount, paidCount });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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

  const isOverdue = (inv: InvoiceListItem) => {
    return (
      new Date(inv.dueDate) < new Date() &&
      !["PAID", "CANCELLED", "CREDITED"].includes(inv.status)
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Factures"
        subtitle="Gestion des factures"
        actions={
          <Button
            variant="accent"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => router.push("/factures/nouveau")}
          >
            Nouvelle facture
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Total facture</div>
            <div className="text-xl font-bold tabular-nums text-zinc-100">
              {formatCurrency(stats.totalAmount)}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">En attente</div>
            <div className="text-xl font-bold tabular-nums text-warning">
              {formatCurrency(stats.pendingAmount)}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">En retard</div>
            <div className="text-xl font-bold tabular-nums text-danger">
              {formatCurrency(stats.overdueAmount)}
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
            <div className="text-xs text-zinc-500 mb-1.5">Payees</div>
            <div className="text-xl font-bold tabular-nums text-success">
              {stats.paidCount}
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

        {/* Invoice List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-12 w-12" />}
            title="Aucune facture"
            description="Aucune facture ne correspond a vos criteres de recherche."
            action={
              <Button
                variant="accent"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => router.push("/factures/nouveau")}
              >
                Creer une facture
              </Button>
            }
          />
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1.2fr_100px_100px_90px_120px_120px_120px_30px] gap-3 text-2xs font-medium text-zinc-600 border-b border-zinc-800/50 pb-2 px-4">
              <div>Reference</div>
              <div>Client</div>
              <div>Emission</div>
              <div>Echeance</div>
              <div>Statut</div>
              <div className="text-right">Total</div>
              <div className="text-right">Paye</div>
              <div className="text-right">Reste</div>
              <div />
            </div>

            {/* Table Rows */}
            {invoices.map((inv) => {
              const overdue = isOverdue(inv);
              const total = toNumber(inv.total);
              const paid = toNumber(inv.amountPaid);
              const due = toNumber(inv.amountDue);
              const pctPaid = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

              return (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/factures/${inv.id}`)}
                  className={[
                    "grid grid-cols-[1fr_1.2fr_100px_100px_90px_120px_120px_120px_30px] gap-3 items-center py-3 px-4 border-b border-zinc-800/30 cursor-pointer hover:bg-zinc-800/30 transition-colors",
                    overdue ? "border-l-2 border-l-danger" : "",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold text-zinc-100">
                    {inv.reference}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200 truncate">
                      {inv.client.name}
                    </div>
                    {inv.client.company && (
                      <div className="text-2xs text-zinc-500 truncate">
                        {inv.client.company}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {formatDate(inv.issueDate)}
                  </div>
                  <div
                    className={`text-xs ${
                      overdue ? "text-danger font-semibold" : "text-zinc-400"
                    }`}
                  >
                    {formatDate(inv.dueDate)}
                    {overdue && (
                      <AlertCircle size={10} className="inline ml-1 text-danger" />
                    )}
                  </div>
                  <div className="flex items-center">
                    <StatusBadge status={overdue ? "OVERDUE" : inv.status} />
                  </div>
                  <div className="text-right text-sm font-bold tabular-nums text-zinc-100">
                    {formatCurrency(total)}
                  </div>
                  <div className="text-right text-sm font-semibold tabular-nums text-success">
                    {formatCurrency(paid)}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold tabular-nums ${
                        due > 0 ? "text-danger" : "text-zinc-500"
                      }`}
                    >
                      {formatCurrency(due)}
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800 mt-1 overflow-hidden">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          pctPaid >= 100
                            ? "bg-success"
                            : overdue
                            ? "bg-danger"
                            : "bg-accent"
                        }`}
                        style={{ width: `${pctPaid}%` }}
                      />
                    </div>
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
                  {pagination.total} facture{pagination.total > 1 ? "s" : ""} — Page{" "}
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
