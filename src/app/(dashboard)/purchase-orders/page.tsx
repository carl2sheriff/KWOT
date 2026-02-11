"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { LoadingCard } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { ShoppingCart, Plus, ChevronRight, Search } from "lucide-react";

interface POListItem {
  id: string;
  reference: string;
  status: string;
  orderDate: string;
  expectedDelivery: string | null;
  total: string | number;
  supplier: { id: string; name: string; company: string | null };
  createdBy: { id: string; name: string };
  _count: { items: number };
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

const STATUS_TABS = [
  { key: "", label: "Tous" },
  { key: "DRAFT", label: "Brouillon" },
  { key: "SENT", label: "Envoye" },
  { key: "CONFIRMED", label: "Confirme" },
  { key: "RECEIVED", label: "Recu" },
];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<POListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/purchase-orders?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setPurchaseOrders(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch purchase orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

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
        title="Bons de commande"
        subtitle="Gestion des achats"
        actions={
          <Link href="/purchase-orders/nouveau">
            <Button variant="accent" size="sm" icon={<Plus size={14} />}>
              Nouveau bon
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-auto p-6">
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

        {/* PO List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
          </div>
        ) : purchaseOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-12 w-12" />}
            title="Aucun bon de commande"
            description="Aucun bon de commande ne correspond a vos criteres de recherche."
            action={
              <Link href="/purchase-orders/nouveau">
                <Button variant="accent" size="sm" icon={<Plus size={14} />}>
                  Creer un bon de commande
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1.2fr_100px_100px_90px_120px_30px] gap-3 text-2xs font-medium text-zinc-600 border-b border-zinc-800/50 pb-2 px-4">
              <div>Reference</div>
              <div>Fournisseur</div>
              <div>Date</div>
              <div>Livraison</div>
              <div>Statut</div>
              <div className="text-right">Total</div>
              <div />
            </div>

            {/* Table Rows */}
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                onClick={() => router.push(`/purchase-orders/${po.id}`)}
                className="grid grid-cols-[1fr_1.2fr_100px_100px_90px_120px_30px] gap-3 items-center py-3 px-4 border-b border-zinc-800/30 cursor-pointer hover:bg-zinc-800/30 transition-colors"
              >
                <div className="text-sm font-semibold text-zinc-100">
                  {po.reference}
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200 truncate">
                    {po.supplier.name}
                  </div>
                  {po.supplier.company && (
                    <div className="text-2xs text-zinc-500 truncate">
                      {po.supplier.company}
                    </div>
                  )}
                </div>
                <div className="text-xs text-zinc-400">
                  {formatDate(po.orderDate)}
                </div>
                <div className="text-xs text-zinc-400">
                  {po.expectedDelivery
                    ? formatDate(po.expectedDelivery)
                    : "-"}
                </div>
                <div>
                  <StatusBadge status={po.status} />
                </div>
                <div className="text-right text-sm font-bold tabular-nums text-zinc-100">
                  {formatCurrency(po.total)}
                </div>
                <div className="flex justify-center">
                  <ChevronRight size={14} className="text-zinc-700" />
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                <div className="text-xs text-zinc-500">
                  {pagination.total} bon{pagination.total > 1 ? "s" : ""} de
                  commande — Page {pagination.page} / {pagination.totalPages}
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
