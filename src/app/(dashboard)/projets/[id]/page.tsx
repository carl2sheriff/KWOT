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
  Percent,
  History,
  Clock,
  Wallet,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { Loading } from "@/components/ui/Loading";
import { ActivityTimeline, TimelineEvent } from "@/components/ui/ActivityTimeline";
import { formatDate } from "@/lib/format";

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

interface Financials {
  revenue: number;
  costs: number;
  margin: number;
  marginRate: number;
  quotedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  totalHours: number;
  billableHours: number;
  timeCost: number;
  expenseCost: number;
  totalCost: number;
  profitability: number;
  profitabilityRate: number;
  timeEntryCount: number;
  expenseCount: number;
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

          {/* Suivi financier */}
          {financials && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 mb-3">Suivi financier</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                {/* Couts engages */}
                <div className="bg-surface-raised border border-warning/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-warning/10">
                      <TrendingDown size={14} className="text-warning" />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Couts engages</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">
                    {formatCurrency(financials.costs)}
                  </p>
                </div>

                {/* Marge brute */}
                <div
                  className={`bg-surface-raised border rounded-xl p-4 ${
                    financials.margin >= 0
                      ? "border-success/30"
                      : "border-danger/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        financials.margin >= 0 ? "bg-success/10" : "bg-danger/10"
                      }`}
                    >
                      <TrendingUp
                        size={14}
                        className={financials.margin >= 0 ? "text-success" : "text-danger"}
                      />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Marge brute</span>
                  </div>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      financials.margin >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatCurrency(financials.margin)}
                  </p>
                </div>

                {/* Taux de marge */}
                <div
                  className={`bg-surface-raised border rounded-xl p-4 ${
                    financials.marginRate >= 0
                      ? "border-success/30"
                      : "border-danger/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        financials.marginRate >= 0 ? "bg-success/10" : "bg-danger/10"
                      }`}
                    >
                      <Percent
                        size={14}
                        className={financials.marginRate >= 0 ? "text-success" : "text-danger"}
                      />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Taux de marge</span>
                  </div>
                  <p
                    className={`text-2xl font-black tabular-nums ${
                      financials.marginRate >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {financials.marginRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rentabilite */}
          {financials && (financials.timeEntryCount > 0 || financials.expenseCount > 0) && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 mb-3">Rentabilite</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800/50">
                      <Clock size={14} className="text-zinc-400" />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Heures</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">{financials.totalHours}h</p>
                  <p className="text-2xs text-zinc-600 mt-1">{financials.billableHours}h facturables</p>
                </div>

                <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-zinc-800/50">
                      <Wallet size={14} className="text-zinc-400" />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Cout total</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">{formatCurrency(financials.totalCost)}</p>
                  <p className="text-2xs text-zinc-600 mt-1">
                    Temps: {formatCurrency(financials.timeCost)} + Depenses: {formatCurrency(financials.expenseCost)}
                  </p>
                </div>

                <div className={`bg-surface-raised border rounded-xl p-4 ${financials.profitability >= 0 ? 'border-success/30' : 'border-danger/30'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${financials.profitability >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                      <TrendingUp size={14} className={financials.profitability >= 0 ? 'text-success' : 'text-danger'} />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Resultat net</span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums ${financials.profitability >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(financials.profitability)}
                  </p>
                </div>

                <div className={`bg-surface-raised border rounded-xl p-4 ${financials.profitabilityRate >= 0 ? 'border-success/30' : 'border-danger/30'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-lg ${financials.profitabilityRate >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
                      <Percent size={14} className={financials.profitabilityRate >= 0 ? 'text-success' : 'text-danger'} />
                    </div>
                    <span className="text-2xs text-zinc-500 font-medium">Taux rentabilite</span>
                  </div>
                  <p className={`text-2xl font-black tabular-nums ${financials.profitabilityRate >= 0 ? 'text-success' : 'text-danger'}`}>
                    {financials.profitabilityRate.toFixed(1)}%
                  </p>
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
        </div>
      </div>
    </div>
  );
}
