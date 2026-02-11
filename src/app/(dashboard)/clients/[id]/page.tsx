"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  FolderOpen,
  Save,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Loading } from "@/components/ui/Loading";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/format";

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface ClientDetail {
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
  projects: Project[];
}

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  status: string;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const { confirm } = useConfirm();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: "",
    status: "",
  });

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${id}`);
      const data = await response.json();
      if (data.success) {
        setClient(data.data);
      } else {
        toast.error("Client non trouve");
        router.push("/clients");
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
      router.push("/clients");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const startEditing = useCallback(() => {
    if (!client) return;
    setEditForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      address: client.address || "",
      notes: client.notes || "",
      status: client.status,
    });
    setEditing(true);
  }, [client]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editForm.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email || "",
        phone: editForm.phone || "",
        company: editForm.company || "",
        address: editForm.address || "",
        notes: editForm.notes || "",
        status: editForm.status,
      };

      const response = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Client mis a jour");
        setEditing(false);
        fetchClient();
      } else {
        toast.error(data.error || "Erreur lors de la mise a jour");
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  }, [editForm, id, fetchClient, toast]);

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: "Supprimer ce client",
      message: "Cette action est irreversible. Tous les liens avec les projets, devis et factures seront perdus.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Client supprime");
        router.push("/clients");
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
    }
  }, [id, confirm, router, toast]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Client" />
        <div className="flex-1 flex items-center justify-center">
          <Loading message="Chargement..." />
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="flex flex-col h-full">
      <Header
        title={client.name}
        actions={
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={cancelEditing}>
                  Annuler
                </Button>
                <Button variant="accent" size="sm" icon={<Save size={14} />} loading={saving} onClick={handleSave}>
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={startEditing}>
                  Modifier
                </Button>
                <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete}>
                  Supprimer
                </Button>
              </>
            )}
            <Link href="/clients">
              <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
                Retour
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Clients", href: "/clients" },
              { label: client.name },
            ]}
          />

          {/* Header info */}
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{client.name}</h2>
              {client.company && (
                <p className="text-sm text-zinc-500 mt-0.5">{client.company}</p>
              )}
            </div>
            <StatusBadge status={client.status} />
          </div>

          {/* Info card */}
          <section>
            <h3 className="text-xs font-medium text-zinc-500 mb-3">Informations</h3>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nom *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Societe</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                      className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Telephone</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Adresse</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors resize-y min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Statut</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full appearance-none bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none transition-colors"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="prospect">Prospect</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-2xs text-zinc-500 mb-0.5">Email</p>
                      <p className="text-sm text-zinc-200">{client.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-2xs text-zinc-500 mb-0.5">Telephone</p>
                      <p className="text-sm text-zinc-200">{client.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-2xs text-zinc-500 mb-0.5">Adresse</p>
                      <p className="text-sm text-zinc-200">{client.address || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-2xs text-zinc-500 mb-0.5">Notes</p>
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap">{client.notes || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-2xs text-zinc-500 mb-0.5">Date de creation</p>
                      <p className="text-sm text-zinc-200">{formatDate(client.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Stats row */}
          <section>
            <h3 className="text-xs font-medium text-zinc-500 mb-3">Activite</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{client._count.projects}</p>
                <p className="text-xs text-zinc-500 mt-1">projet{client._count.projects !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{client._count.quotes}</p>
                <p className="text-xs text-zinc-500 mt-1">devis</p>
              </div>
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-zinc-100 tabular-nums">{client._count.invoices}</p>
                <p className="text-xs text-zinc-500 mt-1">facture{client._count.invoices !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </section>

          {/* Recent projects */}
          <section>
            <h3 className="text-xs font-medium text-zinc-500 mb-3">Projets recents</h3>
            {client.projects.length === 0 ? (
              <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-8 text-center">
                <FolderOpen size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Aucun projet</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {client.projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-surface-raised border border-zinc-800/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-zinc-100">{project.name}</span>
                      <span className="text-2xs text-zinc-600">{formatDate(project.createdAt)}</span>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
