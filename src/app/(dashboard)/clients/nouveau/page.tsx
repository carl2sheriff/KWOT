"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useToast } from "@/components/ui/Toast";

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  status: string;
}

export default function NouveauClientPage() {
  const router = useRouter();
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    status: "active",
  });

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
      newErrors.name = "Nom requis";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.email]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
      };

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Client cree avec succes");
        router.push("/clients");
      } else {
        toast.error(data.error || "Erreur lors de la creation du client");
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(
            data.details as Record<string, string[]>
          )) {
            fieldErrors[key] =
              Array.isArray(value) ? value[0] : String(value);
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Nouveau client"
        actions={
          <Link href="/clients">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
              Retour
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 pb-28">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Clients", href: "/clients" },
              { label: "Nouveau client" },
            ]}
          />

          {/* Form */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">Informations</h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-5">
              <Input
                label="Nom *"
                placeholder="Nom du client"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                error={errors.name}
              />
              <Input
                label="Societe"
                placeholder="Nom de la societe"
                value={formData.company}
                onChange={(e) => updateField("company", e.target.value)}
                error={errors.company}
              />
              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@exemple.fr"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  error={errors.email}
                />
                <Input
                  label="Telephone"
                  type="tel"
                  placeholder="+33 6 00 00 00 00"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  error={errors.phone}
                />
              </div>
              <Input
                label="Adresse"
                placeholder="Adresse complete"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                error={errors.address}
              />
              <Textarea
                label="Notes"
                placeholder="Notes internes..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                error={errors.notes}
              />
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) => updateField("status", e.target.value)}
                options={[
                  { value: "active", label: "Actif" },
                  { value: "inactive", label: "Inactif" },
                  { value: "prospect", label: "Prospect" },
                ]}
                error={errors.status}
              />
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
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
