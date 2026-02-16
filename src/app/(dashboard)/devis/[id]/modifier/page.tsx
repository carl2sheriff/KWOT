"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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

export default function ModifierDevisPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
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

  // Fetch existing quote
  useEffect(() => {
    if (!id) return;
    
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/quotes/${id}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const quote = data.data;
          
          setFormData({
            clientId: quote.clientId || "",
            projectId: quote.projectId || "",
            validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : "",
            taxRate: Number(quote.taxRate) || 20,
            discount: Number(quote.discount) || 0,
            discountType: quote.discountType || "PERCENTAGE",
            clientPONumber: quote.clientPONumber || "",
            notes: quote.notes || "",
            terms: quote.terms || "",
          });

          if (quote.items && quote.items.length > 0) {
            setItems(quote.items.map((item: any, idx: number) => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              unitCost: Number(item.unitCost) || 0,
              discount: Number(item.discount),
              taxRate: Number(item.taxRate),
              total: Number(item.total),
              position: item.position ?? idx,
            })));
          }

          if (quote.milestones && quote.milestones.length > 0) {
            setMilestones(quote.milestones.map((m: any, idx: number) => ({
              id: m.id,
              label: m.label,
              percentage: Number(m.percentage),
              position: m.position ?? idx,
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load quote:", err);
        toast.error("Erreur lors du chargement du devis");
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [id, toast]);

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

  const handleSubmit = useCallback(async () => {
    if (!formData.clientId) {
      setErrors({ clientId: "Veuillez sélectionner un client" });
      return;
    }

    if (items.every((item) => !item.description.trim())) {
      setErrors({ items: "Veuillez ajouter au moins un article" });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          validUntil: formData.validUntil || null,
          items: items.map((item) => ({
            ...item,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost || 0,
            total: item.total,
          })),
          milestones,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Devis mis à jour avec succès");
        router.push(`/devis/${id}`);
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  }, [formData, items, milestones, id, router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Modifier le devis"
        subtitle={id}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/devis/${id}`}>
              <Button variant="secondary" size="sm">
                Annuler
              </Button>
            </Link>
            <Button
              variant="accent"
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
              icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Client & Projet */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-100">Client & Projet</h2>
            
            <ClientSelector
              value={formData.clientId}
              onChange={(clientId) => updateField("clientId", clientId)}
              error={errors.clientId}
            />

            {formData.clientId && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Projet lie
                </label>
                <Select
                  value={formData.projectId}
                  onChange={(e) => updateField("projectId", e.target.value)}
                  options={[
                    { value: "", label: "Aucun projet" },
                  ]}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date de validite"
                type="date"
                value={formData.validUntil}
                onChange={(e) => updateField("validUntil", e.target.value)}
              />
              <Input
                label="N° BC Client"
                value={formData.clientPONumber}
                onChange={(e) => updateField("clientPONumber", e.target.value)}
                placeholder="EX: BC-2026-001"
              />
            </div>
          </div>

          {/* Articles */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-100">Articles</h2>
            
            {errors.items && (
              <p className="text-sm text-danger">{errors.items}</p>
            )}
            
            <LineItemsEditor
              items={items}
              onChange={setItems}
              readOnly={false}
            />
          </div>

          {/* Acomptes */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-100">Acomptes</h2>
            <MilestoneEditor
              milestones={milestones}
              onChange={setMilestones}
            />
          </div>

          {/* Totaux */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-100">Totaux</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Taux de TVA
                </label>
                <Select
                  value={String(formData.taxRate)}
                  onChange={(e) => updateField("taxRate", Number(e.target.value))}
                  options={[
                    { value: "0", label: "0%" },
                    { value: "10", label: "10%" },
                    { value: "20", label: "20%" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Remise
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.discount}
                    onChange={(e) => updateField("discount", Number(e.target.value))}
                    className="flex-1"
                  />
                  <Select
                    value={formData.discountType}
                    onChange={(e) => updateField("discountType", e.target.value as any)}
                    options={[
                      { value: "PERCENTAGE", label: "%" },
                      { value: "FIXED", label: "€" },
                    ]}
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            <TotalsSummary totals={totals} />
          </div>

          {/* Notes */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-100">Notes & Conditions</h2>
            
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Notes visibles sur le devis..."
              rows={3}
            />
            
            <Textarea
              label="Conditions Generales"
              value={formData.terms}
              onChange={(e) => updateField("terms", e.target.value)}
              placeholder="Conditions Generales de Vente..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
