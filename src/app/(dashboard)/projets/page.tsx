"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  ChevronRight,
  Search,
  Briefcase,
  CheckCircle2,
  LayoutGrid,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCard } from "@/components/ui/Loading";
import { formatDate } from "@/lib/format";

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: string | number | null;
  createdAt: string;
  client: { id: string; name: string };
  owner: { id: string; name: string };
  _count: { tasks: number; quotes: number; invoices: number; purchaseOrders: number };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { value: "", label: "Tous" },
  { value: "draft", label: "Brouillon" },
  { value: "active", label: "Actif" },
  { value: "completed", label: "Termine" },
  { value: "cancelled", label: "Annule" },
];

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num);
}

export default function ProjetsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      const response = await fetch(`/api/projects?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProjects(data.data || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { setPagination((prev) => ({ ...prev, page: 1 })); }, [search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: pagination.total,
      active: projects.filter((p) => p.status === "active").length,
      completed: projects.filter((p) => p.status === "completed").length,
    };
  }, [projects, pagination.total]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Projets"
        subtitle="Gestion des projets"
        actions={
          <Link href="/projets/nouveau">
            <Button variant="accent" size="sm" icon={<Plus size={14} />}>Nouveau projet</Button>
          </Link>
        }
      />

      <div className="flex-1 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-raised border border-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800/50">
                <LayoutGrid size={16} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-2xs text-zinc-500 font-medium">Total projets</p>
                <p className="text-lg font-bold text-zinc-100 tabular-nums">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Briefcase size={16} className="text-success" />
              </div>
              <div>
                <p className="text-2xs text-zinc-500 font-medium">Actifs</p>
                <p className="text-lg font-bold text-success tabular-nums">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CheckCircle2 size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-2xs text-zinc-500 font-medium">Termines</p>
                <p className="text-lg font-bold text-accent tabular-nums">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter Tabs */}
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

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-12 w-12" />}
            title="Aucun projet"
            description="Creez votre premier projet pour commencer"
            action={<Link href="/projets/nouveau"><Button variant="accent" size="sm" icon={<Plus size={14} />}>Nouveau projet</Button></Link>}
          />
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_100px_120px_90px_90px_70px_70px] gap-3 px-4 py-2 mb-1">
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider">Nom</span>
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider">Client</span>
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider">Statut</span>
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider text-right">Budget</span>
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider">Debut</span>
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider">Fin</span>
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider text-center">Taches</span>
              <span className="text-2xs font-medium text-zinc-600 uppercase tracking-wider text-center">Devis</span>
            </div>

            {/* Table Rows */}
            <div className="space-y-1.5">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/projets/${project.id}`)}
                  className="w-full bg-surface-raised border border-zinc-800/50 rounded-lg p-4 hover:border-zinc-700 transition-all duration-150 flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="hidden md:grid grid-cols-[1fr_1fr_100px_120px_90px_90px_70px_70px] gap-3 items-center w-full">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold text-sm text-zinc-100 truncate">{project.name}</span>
                      {project.description && (
                        <span className="text-2xs text-zinc-600 truncate">{project.description}</span>
                      )}
                    </div>
                    <span className="text-sm text-zinc-400 truncate">{project.client.name}</span>
                    <div><StatusBadge status={project.status} /></div>
                    <span className="text-sm font-medium text-zinc-200 tabular-nums text-right">
                      {project.budget ? formatCurrency(project.budget) : <span className="text-zinc-600">--</span>}
                    </span>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {project.startDate ? formatDate(project.startDate) : <span className="text-zinc-700">--</span>}
                    </span>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {project.endDate ? formatDate(project.endDate) : <span className="text-zinc-700">--</span>}
                    </span>
                    <span className="text-xs text-zinc-400 text-center tabular-nums">{project._count.tasks}</span>
                    <span className="text-xs text-zinc-400 text-center tabular-nums">{project._count.quotes}</span>
                  </div>

                  {/* Mobile layout */}
                  <div className="flex md:hidden items-center justify-between w-full">
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="font-semibold text-sm text-zinc-100 truncate">{project.name}</span>
                      <span className="text-xs text-zinc-500">{project.client.name}</span>
                      <span className="text-2xs text-zinc-600">
                        {project.budget ? formatCurrency(project.budget) : "--"}
                        {" · "}
                        {project._count.tasks} tache{project._count.tasks > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex-shrink-0 mx-3"><StatusBadge status={project.status} /></div>
                    <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))}
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
