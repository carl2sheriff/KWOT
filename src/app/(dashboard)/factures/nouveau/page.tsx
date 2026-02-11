"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { LineItemsEditor } from "@/components/financial/LineItemsEditor";
import { TotalsSummary } from "@/components/financial/TotalsSummary";
import { ArrowLeft, Save, Receipt } from "lucide-react";
import type { LineItem } from "@/components/financial/LineItemsEditor";

// ============================================
// Types
// ============================================

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

// ============================================
// Calculation Helpers
// ============================================

function calculateTotals(
  items: LineItem[],
  defaultTaxRate: number,
  discount: number
): { subtotal: number; taxAmount: number; total: number; taxBreakdown: { rate: number; base: number; amount: number }[] } {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = Math.round(subtotal * (discount / 100) * 100) / 100;
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
  return { subtotal, taxAmount, total, taxBreakdown };
}

// ============================================
// Main Page
// ============================================

export default function NouvelleFacturePage() {
  const router = useRouter();

  // Form state
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientPONumber, setClientPONumber] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [taxRate, setTaxRate] = useState(20);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
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

  // Data state
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch clients
  useEffect(() => {
    fetch("/api/clients?limit=100")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setClients(json.data);
      })
      .catch(console.error);
  }, []);

  // Fetch projects for selected client
  const fetchProjects = useCallback(async () => {
    if (!clientId) {
      setProjects([]);
      return;
    }
    try {
      const res = await fetch(`/api/projects?clientId=${clientId}&limit=100`);
      const json = await res.json();
      if (json.success) setProjects(json.data);
    } catch {
      console.error("Failed to fetch projects");
    }
  }, [clientId]);

  useEffect(() => {
    fetchProjects();
    setProjectId("");
  }, [fetchProjects]);

  // Computed totals
  const totals = calculateTotals(items, taxRate, discount);

  const handleSubmit = async () => {
    // Validation
    if (!clientId) {
      setError("Veuillez selectionner un client");
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description)) {
      setError("Veuillez ajouter au moins un article");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          projectId: projectId || null,
          dueDate: new Date(dueDate),
          taxRate,
          discount,
          clientPONumber: clientPONumber || null,
          notes: notes || undefined,
          items: items
            .filter((i) => i.description)
            .map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
            })),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Erreur lors de la creation");
        return;
      }

      router.push(`/factures/${json.data.id}`);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="NOUVELLE FACTURE"
        subtitle="Creer une facture"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/factures")}
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-[#999] hover:text-black px-3 py-2 rounded-[10px] hover:bg-[#F5F5F5] transition-colors"
            >
              <ArrowLeft size={14} />
              RETOUR
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-black text-white text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] hover:bg-black/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={14} />
              {submitting ? "ENREGISTREMENT..." : "ENREGISTRER"}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Error */}
        {error && (
          <div className="bg-[#FF00C4]/10 text-[#FF00C4] text-[11px] font-bold px-4 py-3 rounded-[10px] mb-6">
            {error}
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Client */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
              CLIENT *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors bg-white"
            >
              <option value="">SELECTIONNER UN CLIENT</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` - ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
              PROJET (OPTIONNEL)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!clientId || projects.length === 0}
              className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors bg-white disabled:bg-[#F5F5F5] disabled:text-[#CCC]"
            >
              <option value="">AUCUN PROJET</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
              DATE ECHEANCE *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors"
            />
          </div>

          {/* Tax Rate */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
                TVA (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step={0.1}
                className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors tabular-nums"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
                REMISE (%)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step={0.1}
                className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors tabular-nums"
              />
            </div>
          </div>

          {/* Client PO Number */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
              N° BC CLIENT
            </label>
            <input
              type="text"
              value={clientPONumber}
              onChange={(e) => setClientPONumber(e.target.value)}
              placeholder="Ex: PO-2026-001"
              className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#999] mb-4">
            <Receipt size={12} className="inline mr-1.5" />
            ARTICLES
          </div>
          <LineItemsEditor items={items} onChange={setItems} />
        </div>

        {/* Totals */}
        <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
          <TotalsSummary
            subtotal={totals.subtotal}
            discount={discount}
            discountType="PERCENTAGE"
            taxRate={taxRate}
            taxAmount={totals.taxAmount}
            total={totals.total}
            taxBreakdown={totals.taxBreakdown}
          />
        </div>

        {/* Notes */}
        <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6">
          <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
            NOTES
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors resize-none"
            placeholder="Notes ou conditions..."
          />
        </div>
      </div>
    </div>
  );
}
