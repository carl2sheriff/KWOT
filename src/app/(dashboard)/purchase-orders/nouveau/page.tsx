"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

// ============================================
// Types
// ============================================

interface Supplier {
  id: string;
  name: string;
  company: string | null;
}

interface Project {
  id: string;
  name: string;
  client: { id: string; name: string };
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// ============================================
// Helpers
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// Main Page Component
// ============================================

export default function NouveauBonDeCommandePage() {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [taxRate, setTaxRate] = useState(20);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: generateTempId(), description: "", quantity: 1, unitPrice: 0 },
  ]);

  // Data lists
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch suppliers and projects on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [suppliersRes, projectsRes] = await Promise.all([
          fetch("/api/suppliers?limit=100"),
          fetch("/api/projects?limit=100"),
        ]);
        const suppliersJson = await suppliersRes.json();
        const projectsJson = await projectsRes.json();

        if (suppliersJson.success) setSuppliers(suppliersJson.data);
        if (projectsJson.success) setProjects(projectsJson.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }
    fetchData();
  }, []);

  // Line items management
  const addItem = () => {
    setItems([
      ...items,
      { id: generateTempId(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  // Submit
  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error("VEUILLEZ SELECTIONNER UN FOURNISSEUR");
      return;
    }

    const validItems = items.filter(
      (item) => item.description.trim() && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error("AJOUTEZ AU MOINS UN ARTICLE");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          projectId: projectId || null,
          expectedDelivery: expectedDelivery || null,
          taxRate,
          notes: notes || null,
          items: validItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast.success("BON DE COMMANDE CREE");
        router.push(`/purchase-orders/${json.data.id}`);
      } else {
        toast.error(json.error || "ERREUR LORS DE LA CREATION");
      }
    } catch (err) {
      console.error("Failed to create PO:", err);
      toast.error("ERREUR LORS DE LA CREATION");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="NOUVEAU BON DE COMMANDE"
        subtitle="Creer un bon de commande"
        actions={
          <Link
            href="/purchase-orders"
            className="flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase text-[#999] hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            RETOUR
          </Link>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl">
          {/* Supplier & Project */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase mb-4">
              INFORMATIONS GENERALES
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Supplier */}
              <div>
                <label className="block text-[10px] tracking-widest text-[#999] font-bold uppercase mb-2">
                  FOURNISSEUR *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-4 py-3 text-[13px] outline-none transition-colors bg-white"
                >
                  <option value="">Selectionner un fournisseur</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.company ? ` (${s.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="block text-[10px] tracking-widest text-[#999] font-bold uppercase mb-2">
                  PROJET (OPTIONNEL)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-4 py-3 text-[13px] outline-none transition-colors bg-white"
                >
                  <option value="">Aucun projet</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Delivery */}
              <div>
                <label className="block text-[10px] tracking-widest text-[#999] font-bold uppercase mb-2">
                  DATE DE LIVRAISON PREVUE
                </label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="w-full border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-4 py-3 text-[13px] outline-none transition-colors"
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-[10px] tracking-widest text-[#999] font-bold uppercase mb-2">
                  TAUX DE TVA (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-4 py-3 text-[13px] outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase">
                ARTICLES
              </h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] uppercase text-[#3C01FC] hover:opacity-70 transition-opacity"
              >
                <Plus size={12} />
                AJOUTER
              </button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_120px_120px_40px] gap-3 text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] pb-2 border-b border-[#E5E5E5]">
              <div>DESCRIPTION</div>
              <div>QUANTITE</div>
              <div>PRIX UNITAIRE</div>
              <div className="text-right">TOTAL</div>
              <div />
            </div>

            {/* Items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_100px_120px_120px_40px] gap-3 items-center py-3 border-b border-[#F5F5F5]"
              >
                {/* Description */}
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                  placeholder="Description de l'article"
                  className="border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-3 py-2 text-[13px] outline-none transition-colors"
                />

                {/* Quantity */}
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "quantity",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min={0.01}
                  step={0.01}
                  className="border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-3 py-2 text-[13px] outline-none transition-colors text-center"
                />

                {/* Unit Price */}
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "unitPrice",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min={0}
                  step={0.01}
                  className="border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-3 py-2 text-[13px] outline-none transition-colors text-right"
                />

                {/* Total */}
                <div className="text-right text-[13px] font-bold tabular-nums">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  className="p-1.5 text-[#CCC] hover:text-[#FF00C4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase mb-4">
              NOTES
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes internes..."
              rows={4}
              className="w-full border-2 border-[#E5E5E5] focus:border-[#3C01FC] rounded-xl px-4 py-3 text-[13px] outline-none transition-colors resize-none"
            />
          </div>

          {/* Totals + Save */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6">
            <div className="flex items-start justify-between">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center gap-8">
                  <span className="text-[11px] text-[#999] font-bold tracking-[0.1em] uppercase w-32">
                    SOUS-TOTAL
                  </span>
                  <span className="text-[14px] font-bold tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-[11px] text-[#999] font-bold tracking-[0.1em] uppercase w-32">
                    TVA ({taxRate}%)
                  </span>
                  <span className="text-[14px] font-bold tabular-nums">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-8 pt-2 border-t border-[#E5E5E5]">
                  <span className="text-[11px] text-black font-black tracking-[0.1em] uppercase w-32">
                    TOTAL TTC
                  </span>
                  <span className="text-[20px] font-black tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 bg-black text-white text-[11px] font-bold tracking-[0.1em] uppercase px-5 py-3 rounded-[10px] hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={14} />
                {saving ? "ENREGISTREMENT..." : "ENREGISTRER"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
