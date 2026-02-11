"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  FileText,
  ClipboardList,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  History,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { Loading } from "@/components/ui/Loading";
import { ActivityTimeline, TimelineEvent } from "@/components/ui/ActivityTimeline";
import { formatDate } from "@/lib/format";
import RevenueAllocation from "./revenue-allocation";

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: string | number | null;
  createdAt: string;
  client: { id: string; name: string; company?: string | null };
  owner: { id: string; name: string };
  _count: { tasks: number; quotes: number; invoices: number; purchaseOrders: number };
}

interface TimeByUser {
  userId: string;
  userName: string;
  hours: number;
  billableHours: number;
  hourlyRate: number;
  totalCost: number;
  entries: number;
}

interface Financials {
  revenue: number;
  quotedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  budget: number;
  timeCost: number;
  expenseCost: number;
  variableCostProvisoire: number;
  poCost: number;
  mscvPrevisionnelle: number;
  mscvPrevisionnelleRate: number;
  mscvProvisoire: number;
  mscvProvisoireRate: number;
  mscvDefinitive: number;
  mscvDefinitiveRate: number;
  totalHours: number;
  billableHours: number;
  timeEntryCount: number;
  expenseCount: number;
  timeByUser: TimeByUser[];
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(num);
}

export default function ProjetDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        if (data.success && data.data) {
          setProject(data.data.project);
          setFinancials(data.data.financials);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    async function fetchTimeline() {
      setTimelineLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/timeline`);
        const data = await response.json();
        if (data.success && data.data) {
          setTimeline(data.data);
        }
      } catch {
        // Timeline fetch failed silently
      } finally {
        setTimelineLoading(false);
      }
    }
    fetchTimeline();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Projet"
          actions={
            <Link href="/projets">
              <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Retour</Button>
            </Link>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <Loading message="Chargement du projet..." />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Projet"
          actions={
            <Link href="/projets">
              <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Retour</Button>
            </Link>
          }
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-zinc-400">Projet introuvable</p>
          <Link href="/projets">
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />}>Retour aux projets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Taches", value: project._count.tasks, icon: <ClipboardList size={16} className="text-zinc-400" /> },
    { label: "Devis", value: project._count.quotes, icon: <FileText size={16} className="text-accent" /> },
    { label: "Factures", value: project._count.invoices, icon: <Receipt size={16} className="text-success" /> },
    { label: "Bons de commande", value: project._count.purchaseOrders, icon: <ShoppingCart size={16} className="text-warning" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title={project.name}
        subtitle={project.client.name}
        actions={
          <Link href="/projets">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Retour</Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
          <Link href="/projets" className="hover:text-zinc-300 transition-colors">Projets</Link>
          <ChevronRight size={12} className="text-zinc-700" />
          <span className="text-zinc-300">{project.name}</span>
        </nav>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{project.name}</h2>
                <p className="text-sm text-zinc-500 mt-0.5">{project.client.name}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>

            {project.description && (
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{project.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <Calendar size={14} className="text-zinc-600" />
                <div>
                  <p className="text-2xs text-zinc-600 font-medium">Debut</p>
                  <p className="text-xs text-zinc-300 tabular-nums">
                    {project.startDate ? formatDate(project.startDate) : "--"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar size={14} className="text-zinc-600" />
                <div>
                  <p className="text-2xs text-zinc-600 font-medium">Fin</p>
                  <p className="text-xs text-zinc-300 tabular-nums">
                    {project.endDate ? formatDate(project.endDate) : "--"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <DollarSign size={14} className="text-zinc-600" />
                <div>
                  <p className="text-2xs text-zinc-600 font-medium">Budget</p>
                  <p className="text-xs text-zinc-300 font-medium tabular-nums">
                    {project.budget ? formatCurrency(project.budget) : "--"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <User size={14} className="text-zinc-600" />
                <div>
                  <p className="text-2xs text-zinc-600 font-medium">Proprietaire</p>
                  <p className="text-xs text-zinc-300">{project.owner.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* MSCV - Marge sur couts variables */}
          {financials && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 mb-3">Marge sur couts variables</h3>

              {/* Ligne 1 : Contexte CA + Couts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* CA facture */}
                <div className="bg-surface-raised border border-accent/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-accent/10">
                      <BarChart3 size={14} className="text-accent" />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">CA facture</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">
                    {formatCurrency(financials.revenue)}
                  </p>
                </div>

                {/* Couts provisoires (Temps + Depenses) */}
                <div className="bg-surface-raised border border-warning/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-warning/10">
                      <TrendingDown size={14} className="text-warning" />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Couts provisoires</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">
                    {formatCurrency(financials.variableCostProvisoire)}
                  </p>
                  <p className="text-2xs text-zinc-600 mt-1">
                    Temps: {formatCurrency(financials.timeCost)} + Dep.: {formatCurrency(financials.expenseCost)}
                  </p>
                </div>

                {/* Couts PO engages */}
                <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800/50">
                      <ShoppingCart size={14} className="text-zinc-400" />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Couts PO engages</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">
                    {formatCurrency(financials.poCost)}
                  </p>
                </div>
              </div>

              {/* Ligne 2 : Les 3 MSCV */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MSCV previsionnelle */}
                <div className={`bg-surface-raised border rounded-xl p-4 ${financials.mscvPrevisionnelle >= 0 ? "border-success/30" : "border-danger/30"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${financials.mscvPrevisionnelle >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
                      <TrendingUp size={14} className={financials.mscvPrevisionnelle >= 0 ? "text-success" : "text-danger"} />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">MSCV previsionnelle</span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums ${financials.mscvPrevisionnelle >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(financials.mscvPrevisionnelle)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-2xs text-zinc-600">Devis - Budget</p>
                    <p className={`text-xs font-bold tabular-nums ${financials.mscvPrevisionnelleRate >= 0 ? "text-success" : "text-danger"}`}>
                      {financials.mscvPrevisionnelleRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* MSCV provisoire */}
                <div className={`bg-surface-raised border rounded-xl p-4 ${financials.mscvProvisoire >= 0 ? "border-success/30" : "border-danger/30"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${financials.mscvProvisoire >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
                      <TrendingUp size={14} className={financials.mscvProvisoire >= 0 ? "text-success" : "text-danger"} />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">MSCV provisoire</span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums ${financials.mscvProvisoire >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(financials.mscvProvisoire)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-2xs text-zinc-600">CA - (Temps + Dep.)</p>
                    <p className={`text-xs font-bold tabular-nums ${financials.mscvProvisoireRate >= 0 ? "text-success" : "text-danger"}`}>
                      {financials.mscvProvisoireRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* MSCV definitive */}
                <div className={`bg-surface-raised border rounded-xl p-4 ${financials.mscvDefinitive >= 0 ? "border-success/30" : "border-danger/30"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${financials.mscvDefinitive >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
                      <TrendingUp size={14} className={financials.mscvDefinitive >= 0 ? "text-success" : "text-danger"} />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">MSCV definitive</span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums ${financials.mscvDefinitive >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(financials.mscvDefinitive)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-2xs text-zinc-600">CA - PO</p>
                    <p className={`text-xs font-bold tabular-nums ${financials.mscvDefinitiveRate >= 0 ? "text-success" : "text-danger"}`}>
                      {financials.mscvDefinitiveRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Tracking per User */}
          {financials && financials.timeByUser && financials.timeByUser.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 mb-3">Suivi du temps par personne</h3>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_80px_100px_100px_120px] gap-3 px-6 py-3 border-b border-zinc-800/50">
                  <div className="text-2xs font-bold tracking-widest uppercase text-zinc-500">Personne</div>
                  <div className="text-2xs font-bold tracking-widest uppercase text-zinc-500 text-right">Heures</div>
                  <div className="text-2xs font-bold tracking-widest uppercase text-zinc-500 text-right">Taux/h</div>
                  <div className="text-2xs font-bold tracking-widest uppercase text-zinc-500 text-right">Cout</div>
                  <div className="text-2xs font-bold tracking-widest uppercase text-zinc-500 text-right">Facturable</div>
                </div>
                {/* Rows */}
                {financials.timeByUser.map((tu) => (
                  <div
                    key={tu.userId}
                    className="grid grid-cols-[1fr_80px_100px_100px_120px] gap-3 px-6 py-3 border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/20 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-zinc-100">{tu.userName}</span>
                      <span className="text-2xs text-zinc-600 ml-2">{tu.entries} saisie{tu.entries > 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-sm text-zinc-100 tabular-nums text-right font-medium">
                      {tu.hours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-zinc-400 tabular-nums text-right">
                      {tu.hourlyRate > 0 ? formatCurrency(tu.hourlyRate) : "-"}
                    </div>
                    <div className="text-sm text-zinc-100 tabular-nums text-right font-bold">
                      {tu.totalCost > 0 ? formatCurrency(tu.totalCost) : "-"}
                    </div>
                    <div className="text-sm tabular-nums text-right">
                      <span className="text-zinc-400">{tu.billableHours.toFixed(1)}h</span>
                      {tu.hours > 0 && (
                        <span className="text-2xs text-zinc-600 ml-1">
                          ({Math.round((tu.billableHours / tu.hours) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Total Row */}
                <div className="grid grid-cols-[1fr_80px_100px_100px_120px] gap-3 px-6 py-3 bg-zinc-800/30 border-t border-zinc-700/50">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total</div>
                  <div className="text-sm text-zinc-100 tabular-nums text-right font-bold">
                    {financials.totalHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-zinc-400 text-right">-</div>
                  <div className="text-sm text-accent tabular-nums text-right font-bold">
                    {formatCurrency(financials.timeCost)}
                  </div>
                  <div className="text-sm tabular-nums text-right">
                    <span className="text-zinc-400">{financials.billableHours.toFixed(1)}h</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-raised border border-zinc-800/50 rounded-lg p-4 flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-zinc-800/50">{stat.icon}</div>
                <div>
                  <p className="text-2xs text-zinc-500 font-medium">{stat.label}</p>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History size={14} className="text-zinc-500" />
                <h3 className="text-xs font-medium text-zinc-500">Historique du projet</h3>
              </div>
              <span className="text-2xs text-zinc-600">{timeline.length} evenements</span>
            </div>
            <ActivityTimeline
              events={timeline}
              loading={timelineLoading}
              emptyMessage="Aucune activite enregistree sur ce projet"
            />
          </div>

          {/* Revenue Allocation */}
          <RevenueAllocation
            projectId={projectId}
            startDate={project.startDate}
            endDate={project.endDate}
          />
        </div>
      </div>
    </div>
  );
}
