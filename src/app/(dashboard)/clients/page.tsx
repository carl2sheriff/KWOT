"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Plus, ChevronRight, Search } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCard } from "@/components/ui/Loading";
import { formatDate } from "@/lib/format";

interface ClientListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  _count: {
    projects: number;
    contacts: number;
    quotes: number;
    invoices: number;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
  { value: "prospect", label: "Prospects" },
];

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      const response = await fetch(`/api/clients?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setClients(data.data || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { setPagination((prev) => ({ ...prev, page: 1 })); }, [search, statusFilter]);

  // KPI calculations
  const totalClients = pagination.total;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const prospectCount = clients.filter((c) => c.status === "prospect").length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Clients"
        subtitle="Gestion des clients"
        actions={
          <Link href="/clients/nouveau">
            <Button variant="accent" size="sm" icon={<Plus size={14} />}>Nouveau client</Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Total clients</p>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">{totalClients}</p>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-success mb-1">Actifs</p>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">{activeCount}</p>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-warning mb-1">Prospects</p>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">{prospectCount}</p>
          </div>
        </div>

        {/* Search + Filters */}
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
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Aucun client"
            description="Ajoutez votre premier client pour commencer"
            action={<Link href="/clients/nouveau"><Button variant="accent" size="sm" icon={<Plus size={14} />}>Nouveau client</Button></Link>}
          />
        ) : (
          <>
            {/* Table */}
            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-raised border-b border-zinc-800/50">
                    <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Nom</th>
                    <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Societe</th>
                    <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Email</th>
                    <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Telephone</th>
                    <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 align-middle">Statut</th>
                    <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Projets</th>
                    <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Devis</th>
                    <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Factures</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/20 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-zinc-100">{client.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-400">{client.company || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-400">{client.email || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-400">{client.phone || "—"}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center"><StatusBadge status={client.status} /></div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm tabular-nums text-zinc-300">{client._count.projects}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm tabular-nums text-zinc-300">{client._count.quotes}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm tabular-nums text-zinc-300">{client._count.invoices}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
