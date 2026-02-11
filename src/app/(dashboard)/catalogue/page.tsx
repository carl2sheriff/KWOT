"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Users2,
  Search,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  MapPin,
  ShoppingCart,
  Trash2,
  Edit3,
  X,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading, LoadingCard } from "@/components/ui/Loading";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

// ============================================
// Types
// ============================================

interface SupplierItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  siret: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  _count: { purchaseOrders: number };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type Tab = "produits" | "prestataires";

// ============================================
// Supplier Form Modal
// ============================================

function SupplierFormModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: SupplierItem | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [siret, setSiret] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setEmail(editData.email || "");
      setPhone(editData.phone || "");
      setCompany(editData.company || "");
      setAddress(editData.address || "");
      setSiret(editData.siret || "");
      setNotes(editData.notes || "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setAddress("");
      setSiret("");
      setNotes("");
    }
    setError("");
  }, [editData, isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const url = editData
        ? `/api/suppliers/${editData.id}`
        : "/api/suppliers";
      const method = editData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, company, address, siret, notes }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Erreur");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Modifier le prestataire" : "Nouveau prestataire"}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger text-xs font-medium px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-2xs font-medium text-zinc-500 mb-1.5">
            Nom *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
            placeholder="Nom du prestataire"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-zinc-500 mb-1.5">
              Societe
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-2xs font-medium text-zinc-500 mb-1.5">
              SIRET
            </label>
            <input
              type="text"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-zinc-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-2xs font-medium text-zinc-500 mb-1.5">
              Telephone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-2xs font-medium text-zinc-500 mb-1.5">
            Adresse
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-2xs font-medium text-zinc-500 mb-1.5">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="accent"
            size="sm"
            icon={<Check size={14} />}
            loading={submitting}
            onClick={handleSubmit}
          >
            {editData ? "Enregistrer" : "Creer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// Main Page
// ============================================

export default function CataloguePage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<Tab>("produits");

  // Suppliers state
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierPagination, setSupplierPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    try {
      const params = new URLSearchParams();
      if (supplierSearch) params.set("search", supplierSearch);
      params.set("page", String(supplierPagination.page));
      params.set("limit", String(supplierPagination.limit));

      const res = await fetch(`/api/suppliers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data || []);
        if (json.pagination) setSupplierPagination(json.pagination);
      }
    } catch {
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  }, [supplierSearch, supplierPagination.page, supplierPagination.limit]);

  useEffect(() => {
    if (activeTab === "prestataires") {
      fetchSuppliers();
    }
  }, [activeTab, fetchSuppliers]);

  useEffect(() => {
    setSupplierPagination((prev) => ({ ...prev, page: 1 }));
  }, [supplierSearch]);

  const handleDeleteSupplier = async (supplier: SupplierItem) => {
    const confirmed = await confirm({
      title: "Supprimer le prestataire",
      message: `Supprimer ${supplier.name} ? Cette action est irreversible.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Prestataire supprime");
        fetchSuppliers();
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleEditSupplier = (supplier: SupplierItem) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    toast.success(editingSupplier ? "Prestataire modifie" : "Prestataire cree");
    setEditingSupplier(null);
    fetchSuppliers();
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "produits", label: "Produits", icon: <Package size={14} /> },
    { key: "prestataires", label: "Prestataires", icon: <Users2 size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Catalogue"
        actions={
          activeTab === "prestataires" ? (
            <Button
              variant="accent"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditingSupplier(null);
                setFormOpen(true);
              }}
            >
              Nouveau prestataire
            </Button>
          ) : (
            <Button variant="accent" size="sm" icon={<Plus size={14} />} disabled>
              Nouveau produit
            </Button>
          )
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-zinc-800/50 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px",
                activeTab === tab.key
                  ? "text-accent border-accent"
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700",
              ].join(" ")}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Produits Tab */}
        {activeTab === "produits" && (
          <EmptyState
            icon={<Package size={48} />}
            title="Catalogue en cours de developpement"
            description="La gestion du catalogue produits sera bientot disponible. Les produits pourront etre associes aux devis et factures."
          />
        )}

        {/* Prestataires Tab */}
        {activeTab === "prestataires" && (
          <div>
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Total prestataires</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">
                  {supplierPagination.total}
                </p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <p className="text-xs text-success mb-1">Actifs</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">
                  {suppliers.filter((s) => s.status === "active").length}
                </p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4">
                <p className="text-xs text-accent mb-1">Bons de commande</p>
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">
                  {suppliers.reduce((sum, s) => sum + s._count.purchaseOrders, 0)}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm mb-5">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Rechercher un prestataire..."
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>

            {suppliersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <LoadingCard key={i} />
                ))}
              </div>
            ) : suppliers.length === 0 ? (
              <EmptyState
                icon={<Users2 size={48} />}
                title="Aucun prestataire"
                description="Ajoutez vos prestataires pour les associer aux bons de commande"
                action={
                  <Button
                    variant="accent"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setEditingSupplier(null);
                      setFormOpen(true);
                    }}
                  >
                    Nouveau prestataire
                  </Button>
                }
              />
            ) : (
              <>
                {/* Supplier Cards */}
                <div className="space-y-2">
                  {suppliers.map((supplier) => {
                    const isExpanded = expandedSupplier === supplier.id;

                    return (
                      <div
                        key={supplier.id}
                        className="bg-surface-raised border border-zinc-800/50 rounded-xl overflow-hidden transition-all duration-150"
                      >
                        {/* Row */}
                        <div
                          onClick={() =>
                            setExpandedSupplier(isExpanded ? null : supplier.id)
                          }
                          className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-zinc-800/20 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-semibold text-zinc-100 truncate">
                                {supplier.name}
                              </span>
                              {supplier.company && (
                                <span className="text-xs text-zinc-500 truncate">
                                  {supplier.company}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {supplier.email && (
                                <span className="flex items-center gap-1 text-2xs text-zinc-500">
                                  <Mail size={10} />
                                  {supplier.email}
                                </span>
                              )}
                              {supplier.phone && (
                                <span className="flex items-center gap-1 text-2xs text-zinc-500">
                                  <Phone size={10} />
                                  {supplier.phone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-zinc-400 tabular-nums">
                              <ShoppingCart size={12} className="text-zinc-600" />
                              {supplier._count.purchaseOrders}
                            </span>
                            <StatusBadge status={supplier.status} />
                            <ChevronRight
                              size={14}
                              className={`text-zinc-600 transition-transform duration-150 ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div className="border-t border-zinc-800/50 px-5 py-4 bg-zinc-900/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              {supplier.company && (
                                <div className="flex items-start gap-2">
                                  <Building2
                                    size={12}
                                    className="text-zinc-600 mt-0.5 shrink-0"
                                  />
                                  <div>
                                    <p className="text-2xs text-zinc-600">Societe</p>
                                    <p className="text-xs text-zinc-300">
                                      {supplier.company}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {supplier.address && (
                                <div className="flex items-start gap-2">
                                  <MapPin
                                    size={12}
                                    className="text-zinc-600 mt-0.5 shrink-0"
                                  />
                                  <div>
                                    <p className="text-2xs text-zinc-600">Adresse</p>
                                    <p className="text-xs text-zinc-300">
                                      {supplier.address}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {supplier.siret && (
                                <div>
                                  <p className="text-2xs text-zinc-600">SIRET</p>
                                  <p className="text-xs text-zinc-300 font-mono">
                                    {supplier.siret}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-2xs text-zinc-600">
                                  Bons de commande
                                </p>
                                <p className="text-xs text-zinc-300 tabular-nums">
                                  {supplier._count.purchaseOrders}
                                </p>
                              </div>
                            </div>

                            {supplier.notes && (
                              <p className="text-xs text-zinc-500 mb-4 italic">
                                {supplier.notes}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<Edit3 size={12} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSupplier(supplier);
                                }}
                              >
                                Modifier
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                icon={<Trash2 size={12} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSupplier(supplier);
                                }}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {supplierPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() =>
                        setSupplierPagination((p) => ({ ...p, page: p.page - 1 }))
                      }
                      disabled={supplierPagination.page <= 1}
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-surface-raised border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Precedent
                    </button>
                    <span className="text-xs text-zinc-500 px-3 tabular-nums">
                      {supplierPagination.page} / {supplierPagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setSupplierPagination((p) => ({ ...p, page: p.page + 1 }))
                      }
                      disabled={
                        supplierPagination.page >= supplierPagination.totalPages
                      }
                      className="text-xs font-medium px-3 py-1.5 rounded-md bg-surface-raised border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingSupplier(null);
        }}
        onSuccess={handleFormSuccess}
        editData={editingSupplier}
      />
    </div>
  );
}
