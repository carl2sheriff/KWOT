"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useToast } from "@/components/ui/Toast";
import { Loading } from "@/components/ui/Loading";
import {
  ArrowLeft,
  Truck,
  Building2,
  Send,
  CheckCircle,
  PackageCheck,
} from "lucide-react";

// ============================================
// Types
// ============================================

interface POItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  total: string | number;
  position: number;
  product: { id: string; name: string; sku: string } | null;
}

interface PurchaseOrderDetail {
  id: string;
  reference: string;
  status: string;
  orderDate: string;
  expectedDelivery: string | null;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  total: string | number;
  notes: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
  };
  project: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  items: POItem[];
}

// ============================================
// Helpers
// ============================================

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR");
}

function toNumber(val: string | number): number {
  return typeof val === "string" ? parseFloat(val) : val;
}

// ============================================
// Status Badge
// ============================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "BROUILLON", className: "bg-[#F5F5F5] text-[#999]" },
    SENT: { label: "ENVOYE", className: "bg-[#FFA839]/10 text-[#FFA839]" },
    CONFIRMED: {
      label: "CONFIRME",
      className: "bg-[#3C01FC]/10 text-[#3C01FC]",
    },
    RECEIVED: { label: "RECU", className: "bg-[#00F816]/10 text-[#00F816]" },
    CANCELLED: {
      label: "ANNULE",
      className: "bg-[#FF00C4]/10 text-[#FF00C4]",
    },
  };
  const c = config[status] || {
    label: status,
    className: "bg-[#F5F5F5] text-[#999]",
  };
  return (
    <span
      className={`${c.className} px-3 py-1 rounded-[10px] text-[10px] font-bold tracking-[0.1em] uppercase`}
    >
      {c.label}
    </span>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [po, setPo] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchPO = useCallback(async () => {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`);
      const json = await res.json();

      if (json.success) {
        setPo(json.data);
      } else {
        toast.error("BON DE COMMANDE INTROUVABLE");
        router.push("/purchase-orders");
      }
    } catch (err) {
      console.error("Failed to fetch PO:", err);
      toast.error("ERREUR DE CHARGEMENT");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchPO();
  }, [fetchPO]);

  // Status actions
  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();

      if (json.success) {
        setPo(json.data);
        toast.success("STATUT MIS A JOUR");
      } else {
        toast.error(json.error || "ERREUR");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("ERREUR LORS DE LA MISE A JOUR");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="CHARGEMENT..." />
        <div className="flex-1 flex items-center justify-center">
          <Loading message="CHARGEMENT DU BON DE COMMANDE" />
        </div>
      </div>
    );
  }

  if (!po) {
    return null;
  }

  // Status action buttons
  const statusActions: Record<
    string,
    { label: string; nextStatus: string; icon: React.ReactNode }
  > = {
    DRAFT: {
      label: "ENVOYER",
      nextStatus: "SENT",
      icon: <Send size={14} />,
    },
    SENT: {
      label: "CONFIRMER",
      nextStatus: "CONFIRMED",
      icon: <CheckCircle size={14} />,
    },
    CONFIRMED: {
      label: "MARQUER RECU",
      nextStatus: "RECEIVED",
      icon: <PackageCheck size={14} />,
    },
  };

  const currentAction = statusActions[po.status];

  return (
    <div className="flex flex-col h-full">
      <Header
        title={po.reference}
        subtitle={po.supplier.name}
        actions={
          <div className="flex items-center gap-3">
            {currentAction && (
              <button
                onClick={() => updateStatus(currentAction.nextStatus)}
                disabled={updating}
                className="flex items-center gap-2 bg-[#3C01FC] text-white text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] hover:bg-[#3C01FC]/80 disabled:opacity-50 transition-colors"
              >
                {currentAction.icon}
                {currentAction.label}
              </button>
            )}
            <Link
              href="/purchase-orders"
              className="flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase text-[#999] hover:text-black transition-colors"
            >
              <ArrowLeft size={14} />
              RETOUR
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl">
          {/* Status + Info Grid */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase">
                DETAILS
              </h2>
              <StatusBadge status={po.status} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Reference */}
              <div>
                <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                  REFERENCE
                </div>
                <div className="text-[14px] font-bold">{po.reference}</div>
              </div>

              {/* Order Date */}
              <div>
                <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                  DATE DE COMMANDE
                </div>
                <div className="text-[14px] font-bold">
                  {formatDate(po.orderDate)}
                </div>
              </div>

              {/* Expected Delivery */}
              <div>
                <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                  LIVRAISON PREVUE
                </div>
                <div className="text-[14px] font-bold flex items-center gap-2">
                  <Truck size={14} className="text-[#999]" />
                  {po.expectedDelivery
                    ? formatDate(po.expectedDelivery)
                    : "Non definie"}
                </div>
              </div>

              {/* Project */}
              <div>
                <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                  PROJET
                </div>
                <div className="text-[14px] font-bold">
                  {po.project ? po.project.name : "Aucun"}
                </div>
              </div>

              {/* Created By */}
              <div>
                <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                  CREE PAR
                </div>
                <div className="text-[14px] font-bold">{po.createdBy.name}</div>
              </div>

              {/* Created At */}
              <div>
                <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                  DATE DE CREATION
                </div>
                <div className="text-[14px] font-bold">
                  {formatDate(po.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Card */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase mb-4 flex items-center gap-2">
              <Building2 size={14} className="text-[#999]" />
              FOURNISSEUR
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                  NOM
                </div>
                <div className="text-[13px] font-bold">{po.supplier.name}</div>
              </div>
              {po.supplier.company && (
                <div>
                  <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                    SOCIETE
                  </div>
                  <div className="text-[13px]">{po.supplier.company}</div>
                </div>
              )}
              {po.supplier.email && (
                <div>
                  <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                    EMAIL
                  </div>
                  <div className="text-[13px]">{po.supplier.email}</div>
                </div>
              )}
              {po.supplier.phone && (
                <div>
                  <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                    TELEPHONE
                  </div>
                  <div className="text-[13px]">{po.supplier.phone}</div>
                </div>
              )}
              {po.supplier.address && (
                <div className="col-span-2">
                  <div className="text-[10px] tracking-widest text-[#999] font-bold uppercase mb-1">
                    ADRESSE
                  </div>
                  <div className="text-[13px]">{po.supplier.address}</div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase mb-4">
              ARTICLES
            </h2>

            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_100px_120px_120px] gap-3 text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] pb-2 border-b border-[#E5E5E5]">
              <div>#</div>
              <div>DESCRIPTION</div>
              <div className="text-center">QTE</div>
              <div className="text-right">PRIX UNIT.</div>
              <div className="text-right">TOTAL</div>
            </div>

            {/* Items */}
            {po.items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[40px_1fr_100px_120px_120px] gap-3 items-center py-3 border-b border-[#F5F5F5]"
              >
                <div className="text-[11px] text-[#999]">{index + 1}</div>
                <div>
                  <div className="text-[13px] font-bold">{item.description}</div>
                  {item.product && (
                    <div className="text-[10px] text-[#999]">
                      SKU: {item.product.sku}
                    </div>
                  )}
                </div>
                <div className="text-center text-[13px] tabular-nums">
                  {toNumber(item.quantity)}
                </div>
                <div className="text-right text-[13px] tabular-nums">
                  {formatCurrency(item.unitPrice)}
                </div>
                <div className="text-right text-[13px] font-bold tabular-nums">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#999] font-bold tracking-[0.1em] uppercase">
                    SOUS-TOTAL
                  </span>
                  <span className="text-[14px] font-bold tabular-nums">
                    {formatCurrency(po.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#999] font-bold tracking-[0.1em] uppercase">
                    TVA ({toNumber(po.taxRate)}%)
                  </span>
                  <span className="text-[14px] font-bold tabular-nums">
                    {formatCurrency(po.taxAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
                  <span className="text-[11px] text-black font-black tracking-[0.1em] uppercase">
                    TOTAL TTC
                  </span>
                  <span className="text-[20px] font-black tabular-nums">
                    {formatCurrency(po.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {po.notes && (
            <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6">
              <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase mb-4">
                NOTES
              </h2>
              <p className="text-[13px] text-[#666] whitespace-pre-wrap">
                {po.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
