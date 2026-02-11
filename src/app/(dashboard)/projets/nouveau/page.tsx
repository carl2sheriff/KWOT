"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface FormData {
  name: string;
  description: string;
  clientId: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: string;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "active", label: "Actif" },
  { value: "completed", label: "Termine" },
  { value: "cancelled", label: "Annule" },
];

export default function NouveauProjetPage() {
  const router = useRouter();
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    clientId: "",
    status: "draft",
    startDate: "",
    endDate: "",
    budget: "",
  });

  useEffect(() => {
    async function fetchClients() {
      setLoadingClients(true);
      try {
        const response = await fetch("/api/clients?limit=100");
        const data = await response.json();
        if (data.success) {
          setClients(
            (data.data || []).map((c: { id: string; name: string; company: string | null }) => ({
              id: c.id,
              name: c.name,
              company: c.company,
            }))
          );
        }
      } catch {
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, []);

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du projet est requis";
    }
    if (!formData.clientId) {
      newErrors.clientId = "Le client est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.clientId]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        clientId: formData.clientId,
        status: formData.status,
      };
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;
      if (formData.budget) payload.budget = parseFloat(formData.budget);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Projet cree avec succes");
        router.push("/projets");
      } else {
        toast.error(data.error || "Erreur lors de la creation du projet");
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(data.details as Record<string, string[]>)) {
            fieldErrors[key] = Array.isArray(value) ? value[0] : String(value);
          }
          setErrors(fieldErrors);
        }
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  }, [formData, validate, router, toast]);

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.company ? `${c.name} (${c.company})` : c.name,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Nouveau projet"
        actions={
          <Link href="/projets">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
              Retour
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 pb-28">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
          <Link href="/projets" className="hover:text-zinc-300 transition-colors">Projets</Link>
          <ChevronRight size={12} className="text-zinc-700" />
          <span className="text-zinc-300">Nouveau projet</span>
        </nav>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Informations generales */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">Informations generales</h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-5">
              <Input
                label="Nom *"
                placeholder="Nom du projet"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                error={errors.name}
              />
              <Textarea
                label="Description"
                placeholder="Description du projet..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
          </section>

          {/* Client & Statut */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">Client & Statut</h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Client *"
                  placeholder={loadingClients ? "Chargement..." : "Selectionner un client"}
                  value={formData.clientId}
                  onChange={(e) => updateField("clientId", e.target.value)}
                  options={clientOptions}
                  disabled={loadingClients}
                  error={errors.clientId}
                />
                <Select
                  label="Statut"
                  value={formData.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>
          </section>

          {/* Dates & Budget */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">Dates & Budget</h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Date de debut"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
                <Input
                  label="Date de fin"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                />
                <Input
                  label="Budget (EUR)"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={formData.budget}
                  onChange={(e) => updateField("budget", e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-[240px] right-0 bg-surface-raised/80 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-4 flex items-center justify-between z-40">
        <Button variant="secondary" size="sm" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button
          variant="accent"
          size="sm"
          loading={saving}
          onClick={handleSave}
        >
          Creer le projet
        </Button>
      </div>
    </div>
  );
}
