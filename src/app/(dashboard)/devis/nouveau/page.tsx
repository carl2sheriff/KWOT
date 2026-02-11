"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ClientSelector } from "@/components/financial/ClientSelector";
import { LineItemsEditor } from "@/components/financial/LineItemsEditor";
import type { LineItem } from "@/components/financial/LineItemsEditor";
import { MilestoneEditor } from "@/components/financial/MilestoneEditor";
import type { Milestone } from "@/components/financial/MilestoneEditor";
import { TotalsSummary } from "@/components/financial/TotalsSummary";
import { useToast } from "@/components/ui/Toast";

interface FormData {
  clientId: string;
  projectId: string;
  validUntil: string;
  taxRate: number;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED";
  clientPONumber: string;
  notes: string;
  terms: string;
}

function calculateTotalsLocal(
  items: LineItem[],
  defaultTaxRate: number,
  discount: number,
  discountType: "PERCENTAGE" | "FIXED"
) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    discountType === "PERCENTAGE"
      ? Math.round(subtotal * (discount / 100) * 100) / 100
      : discount;
  const afterDiscount = subtotal - discountAmount;
  const discountRatio = subtotal > 0 ? afterDiscount / subtotal : 0;

  // Group items by tax rate for multi-TVA breakdown
  const rateGroups = new Map<number, number>();
  for (const item of items) {
    const rate = item.taxRate ?? defaultTaxRate;
    const itemHT = item.total;
    const adjustedHT = Math.round(itemHT * discountRatio * 100) / 100;
    rateGroups.set(rate, (rateGroups.get(rate) || 0) + adjustedHT);
  }

  const taxBreakdown: { rate: number; base: number; amount: number }[] = [];
  let taxAmount = 0;
  for (const [rate, base] of rateGroups) {
    const tax = Math.round(base * (rate / 100) * 100) / 100;
    taxAmount += tax;
    taxBreakdown.push({ rate, base, amount: tax });
  }
  taxBreakdown.sort((a, b) => a.rate - b.rate);

  const total = Math.round((afterDiscount + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total,
    taxBreakdown,
  };
}

export default function NouveauDevisPage() {
  const router = useRouter();
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    clientId: "",
    projectId: "",
    validUntil: "",
    taxRate: 20,
    discount: 0,
    discountType: "PERCENTAGE",
    clientPONumber: "",
    notes: "",
    terms: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 20,
      total: 0,
      position: 1,
    },
  ]);

  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const totals = useMemo(
    () =>
      calculateTotalsLocal(
        items,
        formData.taxRate,
        formData.discount,
        formData.discountType
      ),
    [items, formData.taxRate, formData.discount, formData.discountType]
  );

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

    if (!formData.clientId) {
      newErrors.clientId = "Client requis";
    }

    const validItems = items.filter((i) => i.description.trim() !== "");
    if (validItems.length === 0) {
      newErrors.items = "Au moins un article requis";
    }

    for (let i = 0; i < items.length; i++) {
      if (items[i].description.trim() === "" && items.length > 1) continue;
      if (items[i].description.trim() === "") {
        newErrors.items = "La description est requise pour chaque article";
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.clientId, items]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const validItems = items.filter((i) => i.description.trim() !== "");
      const payload = {
        clientId: formData.clientId,
        projectId: formData.projectId || null,
        validUntil: formData.validUntil
          ? new Date(formData.validUntil).toISOString()
          : null,
        taxRate: formData.taxRate,
        discount: formData.discount,
        discountType: formData.discountType,
        clientPONumber: formData.clientPONumber || null,
        notes: formData.notes || "",
        terms: formData.terms || "",
        items: validItems.map((item) => ({
          productId: item.productId || null,
          description: item.description,
          section: item.section || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
        })),
        milestones: milestones
          .filter((m) => m.label.trim() !== "")
          .map((m) => ({
            label: m.label,
            percentage: m.percentage,
            position: m.position,
          })),
      };

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Devis cree avec succes");
        router.push(`/devis/${data.data.id}`);
      } else {
        toast.error(data.error || "Erreur lors de la creation du devis");
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
  }, [formData, items, validate, router, toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Nouveau devis"
        actions={
          <Link href="/devis">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
              Retour
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 pb-28">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Client Section */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">
              Client
            </h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <ClientSelector
                value={formData.clientId || null}
                onChange={(clientId) => updateField("clientId", clientId)}
                error={errors.clientId}
              />
            </div>
          </section>

          {/* Conditions Section */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">
              Conditions
            </h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Date de validite"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => updateField("validUntil", e.target.value)}
                />
                <Input
                  label="Taux de TVA (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.taxRate}
                  onChange={(e) =>
                    updateField("taxRate", parseFloat(e.target.value) || 0)
                  }
                />
                <Input
                  label="Remise globale"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.discount}
                  onChange={(e) =>
                    updateField("discount", parseFloat(e.target.value) || 0)
                  }
                />
                <Select
                  label="Type de remise"
                  value={formData.discountType}
                  onChange={(e) =>
                    updateField(
                      "discountType",
                      e.target.value as "PERCENTAGE" | "FIXED"
                    )
                  }
                  options={[
                    { value: "PERCENTAGE", label: "Pourcentage (%)" },
                    { value: "FIXED", label: "Montant fixe (EUR)" },
                  ]}
                />
                <Input
                  label="N° bon de commande client"
                  type="text"
                  value={formData.clientPONumber}
                  onChange={(e) =>
                    updateField("clientPONumber", e.target.value)
                  }
                  placeholder="Ex: PO-2026-001"
                />
              </div>
            </div>
          </section>

          {/* Line Items Section */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">
              Articles
            </h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <LineItemsEditor items={items} onChange={setItems} />
              {errors.items && (
                <p className="text-2xs text-danger mt-2 font-medium">
                  {errors.items}
                </p>
              )}
            </div>
          </section>

          {/* Milestones Section */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">
              Jalons de facturation
            </h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <MilestoneEditor
                milestones={milestones}
                onChange={setMilestones}
              />
            </div>
          </section>

          {/* Totals Section */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">
              Totaux
            </h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <TotalsSummary
                subtotal={totals.subtotal}
                discount={formData.discount}
                discountType={formData.discountType}
                taxRate={formData.taxRate}
                taxAmount={totals.taxAmount}
                total={totals.total}
                taxBreakdown={totals.taxBreakdown}
              />
            </div>
          </section>

          {/* Notes & Terms Section */}
          <section>
            <h2 className="text-xs font-medium text-zinc-500 mb-3">
              Notes & Conditions
            </h2>
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-6">
              <Textarea
                label="Notes"
                placeholder="Notes internes ou commentaires..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
              <Textarea
                label="Conditions"
                placeholder="Conditions generales, modalites de paiement..."
                value={formData.terms}
                onChange={(e) => updateField("terms", e.target.value)}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-[240px] right-0 bg-surface-raised/80 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-4 flex items-center justify-between z-40">
        <Link href="/devis">
          <Button variant="secondary" size="sm">
            Annuler
          </Button>
        </Link>
        <Button
          variant="accent"
          size="sm"
          loading={saving}
          onClick={handleSave}
        >
          Enregistrer le brouillon
        </Button>
      </div>
    </div>
  );
}
