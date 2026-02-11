"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Clock, Plus, Play, Square, Pencil, Trash2, FolderKanban, Users as UsersIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCard } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { formatDate } from "@/lib/format";
import { formatCurrency } from "@/lib/numbering";

// ============================================
// Types
// ============================================

interface Project {
  id: string;
  name: string;
}

interface TimeEntryItem {
  id: string;
  projectId: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  hourlyRate: string | null;
  billable: boolean;
  invoiced: boolean;
  acId: number | null;
  project: { id: string; name: string };
  user?: { id: string; name: string };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface ProjectTimeSummary {
  id: string;
  name: string;
  status: string;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
  client: { id: string; name: string } | null;
  bu: { id: string; name: string; code: string } | null;
  timeSummary: {
    totalHours: number;
    billableHours: number;
    totalCost: number;
    expenseCost: number;
    totalCostAll: number;
    uniqueUsers: number;
    userBreakdown: { userId: string; userName: string; hours: number; cost: number }[];
  };
  budgetUtilization: number | null;
  invoiceRevenue: number;
  mscvProvisoire: number;
  mscvProvisoireRate: number | null;
}

// ============================================
// Helpers
// ============================================

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "\u2014";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatHours(hours: number): string {
  if (!hours) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function calculateAmount(duration: number | null, hourlyRate: string | null): number {
  if (!duration || !hourlyRate) return 0;
  return (duration / 60) * parseFloat(hourlyRate);
}

function getBudgetColor(utilization: number | null): { text: string; bg: string; bar: string } {
  if (utilization === null) return { text: "text-zinc-500", bg: "bg-zinc-800/50", bar: "bg-zinc-600" };
  if (utilization > 100) return { text: "text-danger", bg: "bg-danger/10", bar: "bg-danger" };
  if (utilization >= 80) return { text: "text-warning", bg: "bg-warning/10", bar: "bg-warning" };
  return { text: "text-success", bg: "bg-success/10", bar: "bg-success" };
}

// ============================================
// Component
// ============================================

type TabKey = "projets" | "entrees";

export default function TempsPage() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<TabKey>("projets");

  // ============================================
  // Tab 1: Par projet state
  // ============================================

  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedBuId, setSelectedBuId] = useState<string>("");
  const [projectSummaries, setProjectSummaries] = useState<ProjectTimeSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBUs, setLoadingBUs] = useState(true);

  // ============================================
  // Tab 2: Entrees state
  // ============================================

  const [entries, setEntries] = useState<TimeEntryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [filterProject, setFilterProject] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterBillable, setFilterBillable] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryItem | null>(null);
  const [formData, setFormData] = useState({
    projectId: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: "",
    hourlyRate: "",
    billable: true,
  });
  const [saving, setSaving] = useState(false);

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerProjectId, setTimerProjectId] = useState("");
  const [timerDescription, setTimerDescription] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // Tab 1: Fetch business units & project summaries
  // ============================================

  const fetchBusinessUnits = useCallback(async () => {
    setLoadingBUs(true);
    try {
      const response = await fetch("/api/business-units?active=true");
      const data = await response.json();
      if (data.success) {
        setBusinessUnits(data.data || []);
      }
    } catch {
      setBusinessUnits([]);
    } finally {
      setLoadingBUs(false);
    }
  }, []);

  const fetchProjectSummaries = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const params = new URLSearchParams();
      if (selectedBuId) params.set("buId", selectedBuId);
      const response = await fetch(`/api/projects/time-summary?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProjectSummaries(data.data || []);
      }
    } catch {
      setProjectSummaries([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [selectedBuId]);

  useEffect(() => {
    fetchBusinessUnits();
  }, [fetchBusinessUnits]);

  useEffect(() => {
    if (activeTab === "projets") {
      fetchProjectSummaries();
    }
  }, [activeTab, fetchProjectSummaries]);

  // ============================================
  // Tab 2: Fetch entries & projects
  // ============================================

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProject) params.set("projectId", filterProject);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);
      if (filterBillable) params.set("billable", filterBillable);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      const response = await fetch(`/api/time-entries?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        // API returns { entries, summary } inside data
        const payload = data.data;
        setEntries(payload?.entries || payload || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterDateFrom, filterDateTo, filterBillable, pagination.page, pagination.limit]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects?limit=100");
      const data = await response.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { setPagination((prev) => ({ ...prev, page: 1 })); }, [filterProject, filterDateFrom, filterDateTo, filterBillable]);

  // ============================================
  // Timer logic
  // ============================================

  useEffect(() => {
    if (timerRunning && timerStart) {
      timerRef.current = setInterval(() => {
        setTimerElapsed(Math.floor((Date.now() - timerStart.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerStart]);

  const startTimer = () => {
    if (!timerProjectId) return;
    setTimerStart(new Date());
    setTimerRunning(true);
    setTimerElapsed(0);
  };

  const stopTimer = async () => {
    if (!timerStart || !timerProjectId) return;
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const endTime = new Date();
    try {
      await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: timerProjectId,
          description: timerDescription || null,
          startTime: timerStart.toISOString(),
          endTime: endTime.toISOString(),
          billable: true,
        }),
      });
      setTimerStart(null);
      setTimerElapsed(0);
      setTimerDescription("");
      fetchEntries();
    } catch {
      // silently fail
    }
  };

  const formatTimerElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ============================================
  // Modal / CRUD
  // ============================================

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormData({
      projectId: "",
      description: "",
      startTime: new Date().toISOString().slice(0, 16),
      endTime: "",
      duration: "",
      hourlyRate: "",
      billable: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (entry: TimeEntryItem) => {
    setEditingEntry(entry);
    setFormData({
      projectId: entry.projectId,
      description: entry.description || "",
      startTime: entry.startTime.slice(0, 16),
      endTime: entry.endTime ? entry.endTime.slice(0, 16) : "",
      duration: entry.duration !== null ? String(entry.duration) : "",
      hourlyRate: entry.hourlyRate || "",
      billable: entry.billable,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.projectId || !formData.startTime) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      projectId: formData.projectId,
      description: formData.description || null,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
      billable: formData.billable,
    };

    if (formData.duration) {
      payload.duration = parseInt(formData.duration);
    }
    if (formData.hourlyRate) {
      payload.hourlyRate = parseFloat(formData.hourlyRate);
    }

    try {
      const url = editingEntry
        ? `/api/time-entries/${editingEntry.id}`
        : "/api/time-entries";
      const method = editingEntry ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setModalOpen(false);
        fetchEntries();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: TimeEntryItem) => {
    if (entry.invoiced) return;
    const ok = await confirm({
      title: "Supprimer cette entree",
      message: `Voulez-vous supprimer cette entree de temps pour "${entry.project.name}" ?`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;

    try {
      await fetch(`/api/time-entries/${entry.id}`, { method: "DELETE" });
      fetchEntries();
    } catch {
      // silently fail
    }
  };

  // ============================================
  // Tab 1: KPI calculations (Par projet)
  // ============================================

  const projectKpis = React.useMemo(() => {
    const totalHours = projectSummaries.reduce((sum, p) => sum + p.timeSummary.totalHours, 0);
    const totalCost = projectSummaries.reduce((sum, p) => sum + p.timeSummary.totalCostAll, 0);
    const totalBudget = projectSummaries.reduce((sum, p) => {
      const b = p.budget ? parseFloat(p.budget) : 0;
      return sum + b;
    }, 0);
    const projectCount = projectSummaries.length;
    return { totalHours, totalCost, totalBudget, projectCount };
  }, [projectSummaries]);

  // ============================================
  // Tab 2: KPI calculations (Entrees)
  // ============================================

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEntries = entries.filter(
    (e) => new Date(e.startTime) >= monthStart
  );

  const totalMinutes = monthEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const billableMinutes = monthEntries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + (e.duration || 0), 0);
  const uninvoicedMinutes = monthEntries
    .filter((e) => e.billable && !e.invoiced)
    .reduce((sum, e) => sum + (e.duration || 0), 0);
  const billableAmount = monthEntries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + calculateAmount(e.duration, e.hourlyRate), 0);

  // ============================================
  // Render
  // ============================================

  const tabs: { key: TabKey; label: string }[] = [
    { key: "projets", label: "Par projet" },
    { key: "entrees", label: "Entrees" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Suivi du temps"
        subtitle="Time tracking"
        actions={
          activeTab === "entrees" ? (
            <Button variant="accent" size="sm" icon={<Plus size={14} />} onClick={openCreateModal}>
              Nouvelle entree
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6">
        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150",
                activeTab === tab.key
                  ? "bg-accent text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================ */}
        {/* TAB 1: Par projet                            */}
        {/* ============================================ */}
        {activeTab === "projets" && (
          <div>
            {/* BU filter chips */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="text-xs text-zinc-500 mr-1">Business Unit :</span>
              <button
                onClick={() => setSelectedBuId("")}
                className={[
                  "text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150",
                  selectedBuId === ""
                    ? "bg-accent text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                ].join(" ")}
              >
                Toutes
              </button>
              {loadingBUs ? (
                <span className="text-xs text-zinc-600">Chargement...</span>
              ) : (
                businessUnits.map((bu) => (
                  <button
                    key={bu.id}
                    onClick={() => setSelectedBuId(bu.id)}
                    className={[
                      "text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150",
                      selectedBuId === bu.id
                        ? "bg-accent text-white"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                    ].join(" ")}
                  >
                    {bu.code}
                  </button>
                ))
              )}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={13} className="text-zinc-500" />
                  <p className="text-xs text-zinc-500">Total heures</p>
                </div>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatHours(projectKpis.totalHours)}</p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-accent">Cout total</span>
                </div>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatCurrency(projectKpis.totalCost)}</p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-success">Budget total</span>
                </div>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">
                  {projectKpis.totalBudget > 0 ? formatCurrency(projectKpis.totalBudget) : "\u2014"}
                </p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FolderKanban size={13} className="text-zinc-500" />
                  <p className="text-xs text-zinc-500">Nombre de projets</p>
                </div>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{projectKpis.projectCount}</p>
              </div>
            </div>

            {/* Project table */}
            {loadingProjects ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
              </div>
            ) : projectSummaries.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="h-12 w-12" />}
                title="Aucun projet avec du temps"
                description="Aucun projet ne contient d'entrees de temps pour le filtre selectionne"
              />
            ) : (
              <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-raised border-b border-zinc-800/50">
                      <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Projet</th>
                      <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Client</th>
                      <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">BU</th>
                      <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Heures</th>
                      <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Cout</th>
                      <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Budget</th>
                      <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 w-40">Utilisation</th>
                      <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">MSCV prov.</th>
                      <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Personnes</th>
                      <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectSummaries.map((project) => {
                      const budgetNum = project.budget ? parseFloat(project.budget) : null;
                      const colors = getBudgetColor(project.budgetUtilization);

                      return (
                        <tr
                          key={project.id}
                          className="border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/20 transition-colors duration-150 group cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/projets/${project.id}`}
                              className="text-sm font-semibold text-zinc-100 hover:text-accent transition-colors"
                            >
                              {project.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-zinc-400">{project.client?.name || "\u2014"}</span>
                          </td>
                          <td className="px-4 py-3">
                            {project.bu ? (
                              <Badge variant="accent" size="sm">{project.bu.code}</Badge>
                            ) : (
                              <span className="text-sm text-zinc-600">\u2014</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium tabular-nums text-zinc-200">
                              {formatHours(project.timeSummary.totalHours)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium tabular-nums text-zinc-200">
                              {formatCurrency(project.timeSummary.totalCostAll)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm tabular-nums text-zinc-400">
                              {budgetNum ? formatCurrency(budgetNum) : "\u2014"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {project.budgetUtilization !== null && budgetNum ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                                    style={{ width: `${Math.min(project.budgetUtilization, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-2xs font-medium tabular-nums whitespace-nowrap ${colors.text}`}>
                                  {project.budgetUtilization.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-zinc-600 text-center block">\u2014</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {project.invoiceRevenue > 0 ? (
                              <div>
                                <span className={`text-sm font-medium tabular-nums ${project.mscvProvisoire >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {formatCurrency(project.mscvProvisoire)}
                                </span>
                                {project.mscvProvisoireRate !== null && (
                                  <span className={`text-2xs ml-1 tabular-nums ${project.mscvProvisoireRate >= 0 ? 'text-success/70' : 'text-danger/70'}`}>
                                    {project.mscvProvisoireRate.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-zinc-600">{"\u2014"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <UsersIcon size={12} className="text-zinc-500" />
                              <span className="text-sm tabular-nums text-zinc-300">{project.timeSummary.uniqueUsers}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={project.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* TAB 2: Entrees                               */}
        {/* ============================================ */}
        {activeTab === "entrees" && (
          <div>
            {/* Quick Timer */}
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={timerProjectId}
                    onChange={(e) => setTimerProjectId(e.target.value)}
                    className="appearance-none bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors w-48"
                  >
                    <option value="">Projet...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={timerDescription}
                    onChange={(e) => setTimerDescription(e.target.value)}
                    placeholder="Description..."
                    className="flex-1 bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg tabular-nums text-zinc-100 w-24 text-center">
                    {formatTimerElapsed(timerElapsed)}
                  </span>
                  {timerRunning ? (
                    <Button variant="danger" size="sm" icon={<Square size={14} />} onClick={stopTimer}>
                      Stop
                    </Button>
                  ) : (
                    <Button
                      variant="accent"
                      size="sm"
                      icon={<Play size={14} />}
                      onClick={startTimer}
                      disabled={!timerProjectId}
                    >
                      Start
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Total heures (mois)</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatDuration(totalMinutes)}</p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <p className="text-xs text-accent mb-1">Heures facturables</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatDuration(billableMinutes)}</p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <p className="text-xs text-warning mb-1">Heures non-facturees</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatDuration(uninvoicedMinutes)}</p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <p className="text-xs text-success mb-1">Montant facturable</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatCurrency(billableAmount)}</p>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 mb-5">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="appearance-none bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
              >
                <option value="">Tous les projets</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                placeholder="Du"
              />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                placeholder="Au"
              />
              <div className="flex items-center gap-1">
                {[
                  { value: "", label: "Tous" },
                  { value: "true", label: "Facturables" },
                  { value: "false", label: "Non-fact." },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterBillable(filter.value)}
                    className={[
                      "text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150",
                      filterBillable === filter.value
                        ? "bg-accent text-white"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                    ].join(" ")}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-12 w-12" />}
                title="Aucune entree de temps"
                description="Commencez a tracker votre temps avec le timer ou ajoutez une entree manuellement"
                action={
                  <Button variant="accent" size="sm" icon={<Plus size={14} />} onClick={openCreateModal}>
                    Nouvelle entree
                  </Button>
                }
              />
            ) : (
              <>
                {/* Table */}
                <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-raised border-b border-zinc-800/50">
                        <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Date</th>
                        <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Projet</th>
                        <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Utilisateur</th>
                        <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Description</th>
                        <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Duree</th>
                        <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Taux</th>
                        <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Montant</th>
                        <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Facturable</th>
                        <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => {
                        const amount = calculateAmount(entry.duration, entry.hourlyRate);
                        return (
                          <tr
                            key={entry.id}
                            className="border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/20 transition-colors duration-150"
                          >
                            <td className="px-4 py-3">
                              <span className="text-sm text-zinc-300 tabular-nums">{formatDate(entry.startTime)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-100">{entry.project.name}</span>
                                {entry.acId && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-accent/10 text-accent">AC</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-zinc-400">{entry.user?.name || "\u2014"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-zinc-400">{entry.description || "\u2014"}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-medium tabular-nums text-zinc-200">{formatDuration(entry.duration)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm tabular-nums text-zinc-400">
                                {entry.hourlyRate ? formatCurrency(entry.hourlyRate) + "/h" : "\u2014"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-medium tabular-nums text-zinc-200">
                                {amount > 0 ? formatCurrency(amount) : "\u2014"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {entry.billable ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium bg-success-muted text-success">
                                  {entry.invoiced ? "Facture" : "Oui"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium bg-zinc-800/50 text-zinc-500">
                                  Non
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal(entry)}
                                  className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                                >
                                  <Pencil size={14} />
                                </button>
                                {!entry.invoiced && (
                                  <button
                                    onClick={() => handleDelete(entry)}
                                    className="p-1.5 rounded-md text-zinc-600 hover:text-danger hover:bg-danger-muted transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingEntry ? "Modifier l'entree" : "Nouvelle entree de temps"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Projet *</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full appearance-none bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
            >
              <option value="">Selectionner un projet</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la tache..."
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Debut *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fin</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Duree (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Auto si debut/fin remplis"
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Taux horaire (EUR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="0.00"
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.billable}
                onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                className="rounded border-zinc-700 bg-surface text-accent focus:ring-accent"
              />
              <span className="text-sm text-zinc-300">Facturable</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={!formData.projectId || !formData.startTime}
            >
              {editingEntry ? "Enregistrer" : "Creer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
