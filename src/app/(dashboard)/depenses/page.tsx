"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, Pencil, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
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

interface ExpenseItem {
  id: string;
  projectId: string;
  category: string;
  description: string;
  amount: string;
  date: string;
  receiptUrl: string | null;
  billable: boolean;
  markupPercent: string;
  invoiced: boolean;
  acId: number | null;
  notes: string | null;
  project: { id: string; name: string };
  user?: { id: string; name: string };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Constants
// ============================================

const CATEGORIES = [
  { value: "transport", label: "Transport", color: "bg-blue-500/10 text-blue-400" },
  { value: "location", label: "Location", color: "bg-purple-500/10 text-purple-400" },
  { value: "catering", label: "Catering", color: "bg-orange-500/10 text-orange-400" },
  { value: "equipment", label: "Equipement", color: "bg-zinc-500/10 text-zinc-400" },
  { value: "props", label: "Accessoires", color: "bg-cyan-500/10 text-cyan-400" },
  { value: "other", label: "Autre", color: "bg-zinc-500/10 text-zinc-500" },
];

function getCategoryBadge(category: string) {
  const cat = CATEGORIES.find((c) => c.value === category);
  if (!cat) return { label: category, color: "bg-zinc-800/50 text-zinc-500" };
  return cat;
}

// ============================================
// Component
// ============================================

export default function DepensesPage() {
  const { confirm } = useConfirm();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [filterProject, setFilterProject] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [formData, setFormData] = useState({
    projectId: "",
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    receiptUrl: "",
    billable: true,
    markupPercent: "0",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // ============================================
  // Fetch data
  // ============================================

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProject) params.set("projectId", filterProject);
      if (filterCategory) params.set("category", filterCategory);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        // API returns { expenses, summary } inside data
        const payload = data.data;
        setExpenses(payload?.expenses || payload || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterCategory, filterDateFrom, filterDateTo, pagination.page, pagination.limit]);

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

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { setPagination((prev) => ({ ...prev, page: 1 })); }, [filterProject, filterCategory, filterDateFrom, filterDateTo]);

  // ============================================
  // Modal / CRUD
  // ============================================

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      projectId: "",
      category: "",
      description: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      receiptUrl: "",
      billable: true,
      markupPercent: "0",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setFormData({
      projectId: expense.projectId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date.slice(0, 10),
      receiptUrl: expense.receiptUrl || "",
      billable: expense.billable,
      markupPercent: expense.markupPercent || "0",
      notes: expense.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.projectId || !formData.category || !formData.description || !formData.amount) return;
    setSaving(true);

    const payload = {
      projectId: formData.projectId,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      receiptUrl: formData.receiptUrl || null,
      billable: formData.billable,
      markupPercent: parseFloat(formData.markupPercent) || 0,
      notes: formData.notes || null,
    };

    try {
      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setModalOpen(false);
        fetchExpenses();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense: ExpenseItem) => {
    if (expense.invoiced) return;
    const ok = await confirm({
      title: "Supprimer cette depense",
      message: `Voulez-vous supprimer la depense "${expense.description}" ?`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;

    try {
      await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      fetchExpenses();
    } catch {
      // silently fail
    }
  };

  // ============================================
  // KPI calculations
  // ============================================

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenses = expenses.filter(
    (e) => new Date(e.date) >= monthStart
  );

  const totalAmount = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const billableAmount = monthExpenses
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const uninvoicedAmount = monthExpenses
    .filter((e) => e.billable && !e.invoiced)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Top category
  const categoryTotals: Record<string, number> = {};
  for (const e of monthExpenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
  }
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategoryBadge = topCategory ? getCategoryBadge(topCategory[0]) : null;

  // ============================================
  // Render
  // ============================================

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Depenses"
        subtitle="Suivi des depenses"
        actions={
          <Button variant="accent" size="sm" icon={<Plus size={14} />} onClick={openCreateModal}>
            Nouvelle depense
          </Button>
        }
      />

      <div className="flex-1 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Total depenses (mois)</p>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-accent mb-1">Facturables</p>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatCurrency(billableAmount)}</p>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-warning mb-1">Non-facturees</p>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatCurrency(uninvoicedAmount)}</p>
          </div>
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Top categorie</p>
            {topCategoryBadge ? (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{formatCurrency(topCategory[1])}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium ${topCategoryBadge.color}`}>
                  {topCategoryBadge.label}
                </span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-zinc-500">—</p>
            )}
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
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
          >
            <option value="">Toutes categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
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
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (<LoadingCard key={i} />))}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-12 w-12" />}
            title="Aucune depense"
            description="Ajoutez votre premiere depense pour commencer le suivi"
            action={
              <Button variant="accent" size="sm" icon={<Plus size={14} />} onClick={openCreateModal}>
                Nouvelle depense
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
                    <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Categorie</th>
                    <th className="text-left text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Description</th>
                    <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Montant</th>
                    <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Markup</th>
                    <th className="text-center text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Facturable</th>
                    <th className="text-right text-2xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const catBadge = getCategoryBadge(expense.category);
                    const markup = parseFloat(expense.markupPercent);
                    return (
                      <tr
                        key={expense.id}
                        className="border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/20 transition-colors duration-150"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm text-zinc-300 tabular-nums">{formatDate(expense.date)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-100">{expense.project.name}</span>
                            {expense.acId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-accent/10 text-accent">AC</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium ${catBadge.color}`}>
                            {catBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-zinc-400">{expense.description}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium tabular-nums text-zinc-200">{formatCurrency(expense.amount)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm tabular-nums text-zinc-400">
                            {markup > 0 ? `${markup}%` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {expense.billable ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium bg-success-muted text-success">
                              {expense.invoiced ? "Facture" : "Oui"}
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
                              onClick={() => openEditModal(expense)}
                              className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                              disabled={expense.invoiced}
                            >
                              <Pencil size={14} />
                            </button>
                            {!expense.invoiced && (
                              <button
                                onClick={() => handleDelete(expense)}
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingExpense ? "Modifier la depense" : "Nouvelle depense"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categorie *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full appearance-none bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
              >
                <option value="">Selectionner une categorie</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la depense..."
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Montant (EUR) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Markup (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.markupPercent}
                onChange={(e) => setFormData({ ...formData, markupPercent: e.target.value })}
                placeholder="0"
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes additionnelles..."
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">URL du recu</label>
            <input
              type="url"
              value={formData.receiptUrl}
              onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
              placeholder="https://..."
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
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
              disabled={!formData.projectId || !formData.category || !formData.description || !formData.amount}
            >
              {editingExpense ? "Enregistrer" : "Creer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
