"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Check,
  X,
  Trash2,
  Edit,
  FileText,
  Receipt,
  Download,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/financial/StatusBadge";
import { LineItemsEditor } from "@/components/financial/LineItemsEditor";
import type { LineItem } from "@/components/financial/LineItemsEditor";
import { TotalsSummary } from "@/components/financial/TotalsSummary";
import { MilestoneEditor } from "@/components/financial/MilestoneEditor";
import type { Milestone } from "@/components/financial/MilestoneEditor";
import { Stepper } from "@/components/ui/Stepper";
import type { Step } from "@/components/ui/Stepper";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface QuoteDetail {
  id: string;
  reference: string;
  version: number;
  status: string;
  validUntil: string | null;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  discount: string | number;
  discountType: string;
  total: string | number;
  clientPONumber: string | null;
  notes: string | null;
  terms: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
  };
  project: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    productId: string | null;
    description: string;
    quantity: string | number;
    unitPrice: string | number;
    discount: string | number;
    taxRate: string | number;
    total: string | number;
    position: number;
    product: {
      id: string;
      name: string;
      sku: string;
    } | null;
  }[];
  versions: {
    id: string;
    version: number;
    changedAt: string;
    changedBy: {
      id: string;
      name: string;
    };
  }[];
  milestones: {
    id: string;
    label: string;
    percentage: number | string;
    position: number;
    invoiceId: string | null;
  }[];
  invoice?: {
    id: string;
    reference: string;
  } | null;
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStepperSteps(status: string): Step[] {
  const steps: { label: string; key: string }[] = [
    { label: "Brouillon", key: "DRAFT" },
    { label: "Envoye", key: "SENT" },
    { label: "Approuve", key: "APPROVED" },
    { label: "Facture", key: "INVOICED" },
  ];

  const statusOrder = ["DRAFT", "SENT", "APPROVED", "INVOICED"];
  const currentIndex = statusOrder.indexOf(status);

  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") {
    return steps.map((step, i) => {
      if (i === 0) return { label: step.label, status: "completed" as const };
      if (i === 1 && (status === "REJECTED" || status === "EXPIRED"))
        return { label: step.label, status: "completed" as const };
      return { label: step.label, status: "pending" as const };
    });
  }

  return steps.map((step, i) => {
    if (i < currentIndex) return { label: step.label, status: "completed" as const };
    if (i === currentIndex) return { label: step.label, status: "current" as const };
    return { label: step.label, status: "pending" as const };
  });
}

export default function DevisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const id = params.id as string;

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotes/${id}`);
      const data = await response.json();
      if (data.success) {
        setQuote(data.data);
      } else {
        toast.error("Devis non trouve");
        router.push("/devis");
      }
    } catch {
      toast.error("Erreur de chargement");
      router.push("/devis");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleSend = useCallback(async () => {
    const confirmed = await confirm({
      title: "Envoyer le devis",
      message: `Voulez-vous marquer le devis ${quote?.reference} comme envoye au client ?`,
      confirmLabel: "Envoyer",
    });
    if (!confirmed) return;

    setActionLoading("send");
    try {
      const response = await fetch(`/api/quotes/${id}/send`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        toast.success("Devis marque comme envoye");
        await fetchQuote();
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  }, [id, quote, confirm, toast, fetchQuote]);

  const handleApprove = useCallback(async () => {
    const confirmed = await confirm({
      title: "Approuver le devis",
      message: `Voulez-vous approuver le devis ${quote?.reference} ?`,
      confirmLabel: "Approuver",
    });
    if (!confirmed) return;

    setActionLoading("approve");
    try {
      const response = await fetch(`/api/quotes/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Devis approuve");
        await fetchQuote();
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  }, [id, quote, confirm, toast, fetchQuote]);

  const handleReject = useCallback(async () => {
    const confirmed = await confirm({
      title: "Refuser le devis",
      message: `Voulez-vous refuser le devis ${quote?.reference} ?`,
      confirmLabel: "Refuser",
      danger: true,
    });
    if (!confirmed) return;

    setActionLoading("reject");
    try {
      const response = await fetch(`/api/quotes/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Devis refuse");
        await fetchQuote();
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  }, [id, quote, confirm, toast, fetchQuote]);

  const handleConvert = useCallback(async () => {
    const confirmed = await confirm({
      title: "Convertir en facture",
      message: `Voulez-vous convertir le devis ${quote?.reference} en facture ? Une nouvelle facture sera creee avec les memes articles et montants.`,
      confirmLabel: "Convertir",
    });
    if (!confirmed) return;

    setActionLoading("convert");
    try {
      const response = await fetch(`/api/quotes/${id}/convert`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Facture ${data.data.reference} creee avec succes`);
        await fetchQuote();
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  }, [id, quote, confirm, toast, fetchQuote]);

  const handleGenerateSituation = useCallback(
    async (milestoneId: string) => {
      const confirmed = await confirm({
        title: "Generer une facture de situation",
        message: "Voulez-vous generer une facture de situation pour ce jalon ?",
        confirmLabel: "Generer",
      });
      if (!confirmed) return;

      setActionLoading("situation");
      try {
        const response = await fetch(`/api/quotes/${id}/situation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId }),
        });
        const data = await response.json();
        if (data.success) {
          toast.success("Facture de situation creee");
          await fetchQuote();
        } else {
          toast.error(data.error || "Erreur");
        }
      } catch {
        toast.error("Erreur de connexion");
      } finally {
        setActionLoading(null);
      }
    },
    [id, confirm, toast, fetchQuote]
  );

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: "Supprimer le devis",
      message: `Voulez-vous supprimer definitivement le devis ${quote?.reference} ? Cette action est irreversible.`,
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!confirmed) return;

    setActionLoading("delete");
    try {
      const response = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        toast.success("Devis supprime");
        router.push("/devis");
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  }, [id, quote, confirm, toast, router]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotes/${id}/pdf`);
      if (!response.ok) { toast.error("Erreur generation PDF"); return; }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quote?.reference || 'devis'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF telecharge");
    } catch {
      toast.error("Erreur de telechargement");
    }
  }, [id, quote, toast]);

  function renderActions() {
    if (!quote) return null;

    switch (quote.status) {
      case "DRAFT":
        return (
          <>
            <Button
              variant="accent"
              size="sm"
              icon={<Send size={14} />}
              loading={actionLoading === "send"}
              onClick={handleSend}
            >
              Envoyer
            </Button>
            <Link href={`/devis/${id}/modifier`}>
              <Button variant="secondary" size="sm" icon={<Edit size={14} />}>
                Modifier
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              loading={actionLoading === "delete"}
              onClick={handleDelete}
            >
              Supprimer
            </Button>
          </>
        );
      case "SENT":
        return (
          <>
            <Button
              variant="accent"
              size="sm"
              icon={<Check size={14} />}
              loading={actionLoading === "approve"}
              onClick={handleApprove}
              className="!bg-success !text-white hover:!bg-success/90"
            >
              Approuver
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<X size={14} />}
              loading={actionLoading === "reject"}
              onClick={handleReject}
            >
              Refuser
            </Button>
          </>
        );
      case "APPROVED":
        return (
          <Button
            variant="accent"
            size="sm"
            icon={<FileText size={14} />}
            loading={actionLoading === "convert"}
            onClick={handleConvert}
          >
            Convertir en facture
          </Button>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loading message="Chargement du devis..." />
      </div>
    );
  }

  if (!quote) return null;

  const items: LineItem[] = quote.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    description: item.description,
    quantity: typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity,
    unitPrice:
      typeof item.unitPrice === "string"
        ? parseFloat(item.unitPrice)
        : item.unitPrice,
    discount:
      typeof item.discount === "string"
        ? parseFloat(item.discount)
        : item.discount,
    taxRate:
      typeof item.taxRate === "string"
        ? parseFloat(item.taxRate)
        : (item.taxRate ?? 20),
    total:
      typeof item.total === "string" ? parseFloat(item.total) : item.total,
    position: item.position,
  }));

  return (
    <div className="flex flex-col h-full">
      <Header
        title={quote.reference}
        subtitle={quote.client.name}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/devis">
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowLeft size={14} />}
              >
                Retour
              </Button>
            </Link>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleDownloadPDF}>
              PDF
            </Button>
            {renderActions()}
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Stepper */}
          <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <Stepper steps={getStepperSteps(quote.status)} />
            {(quote.status === "REJECTED" ||
              quote.status === "CANCELLED" ||
              quote.status === "EXPIRED") && (
              <div className="mt-4 flex justify-center">
                <StatusBadge status={quote.status} />
              </div>
            )}
          </section>

          {/* Quote Info Card */}
          <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-xs font-medium text-zinc-500 mb-4">
              Informations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <span className="text-2xs text-zinc-600 block mb-1">
                  Reference
                </span>
                <span className="text-sm font-semibold text-zinc-100">{quote.reference}</span>
              </div>
              <div>
                <span className="text-2xs text-zinc-600 block mb-1">
                  Version
                </span>
                <span className="text-sm font-semibold text-zinc-100">v{quote.version}</span>
              </div>
              <div>
                <span className="text-2xs text-zinc-600 block mb-1">
                  Statut
                </span>
                <StatusBadge status={quote.status} />
              </div>
              <div>
                <span className="text-2xs text-zinc-600 block mb-1">
                  Client
                </span>
                <span className="text-sm font-semibold text-zinc-100">
                  {quote.client.name}
                </span>
                {quote.client.company && (
                  <span className="text-xs text-zinc-500 block">
                    {quote.client.company}
                  </span>
                )}
              </div>
              {quote.project && (
                <div>
                  <span className="text-2xs text-zinc-600 block mb-1">
                    Projet
                  </span>
                  <span className="text-sm font-semibold text-zinc-100">
                    {quote.project.name}
                  </span>
                </div>
              )}
              <div>
                <span className="text-2xs text-zinc-600 block mb-1">
                  Date de creation
                </span>
                <span className="text-sm text-zinc-300">
                  {formatDate(quote.createdAt)}
                </span>
              </div>
              {quote.validUntil && (
                <div>
                  <span className="text-2xs text-zinc-600 block mb-1">
                    Valide jusqu&apos;au
                  </span>
                  <span className="text-sm text-zinc-300">
                    {formatDate(quote.validUntil)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-2xs text-zinc-600 block mb-1">
                  Cree par
                </span>
                <span className="text-sm text-zinc-300">{quote.createdBy.name}</span>
              </div>
              {quote.clientPONumber && (
                <div>
                  <span className="text-2xs text-zinc-600 block mb-1">
                    N° BC client
                  </span>
                  <span className="text-sm font-semibold text-zinc-100">
                    {quote.clientPONumber}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Line Items */}
          <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-xs font-medium text-zinc-500 mb-4">
              Articles
            </h2>
            <LineItemsEditor items={items} onChange={() => {}} readOnly />
          </section>

          {/* Totals */}
          <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-xs font-medium text-zinc-500 mb-4">
              Totaux
            </h2>
            <TotalsSummary
              subtotal={
                typeof quote.subtotal === "string"
                  ? parseFloat(quote.subtotal)
                  : quote.subtotal
              }
              discount={
                typeof quote.discount === "string"
                  ? parseFloat(quote.discount)
                  : quote.discount
              }
              discountType={quote.discountType as "PERCENTAGE" | "FIXED"}
              taxRate={
                typeof quote.taxRate === "string"
                  ? parseFloat(quote.taxRate)
                  : quote.taxRate
              }
              taxAmount={
                typeof quote.taxAmount === "string"
                  ? parseFloat(quote.taxAmount)
                  : quote.taxAmount
              }
              total={
                typeof quote.total === "string"
                  ? parseFloat(quote.total)
                  : quote.total
              }
            />
          </section>

          {/* Milestones */}
          {quote.milestones && quote.milestones.length > 0 && (
            <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <h2 className="text-xs font-medium text-zinc-500 mb-4">
                Jalons de facturation
              </h2>
              <MilestoneEditor
                milestones={quote.milestones.map((m) => ({
                  id: m.id,
                  label: m.label,
                  percentage:
                    typeof m.percentage === "string"
                      ? parseFloat(m.percentage)
                      : m.percentage,
                  position: m.position,
                  invoiceId: m.invoiceId,
                }))}
                onChange={() => {}}
                readOnly
                quoteTotal={
                  typeof quote.total === "string"
                    ? parseFloat(quote.total)
                    : quote.total
                }
              />
              {quote.status === "APPROVED" && (
                <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-2">
                  {quote.milestones
                    .filter((m) => !m.invoiceId)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-400">
                          {m.label} ({typeof m.percentage === "string" ? parseFloat(m.percentage) : m.percentage}%)
                        </span>
                        <button
                          onClick={() => handleGenerateSituation(m.id)}
                          disabled={actionLoading === "situation"}
                          className="flex items-center gap-1.5 text-2xs font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
                        >
                          <Receipt size={12} />
                          Generer facture
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}

          {/* Notes */}
          {quote.notes && (
            <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <h2 className="text-xs font-medium text-zinc-500 mb-3">
                Notes
              </h2>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {quote.notes}
              </p>
            </section>
          )}

          {/* Terms */}
          {quote.terms && (
            <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <h2 className="text-xs font-medium text-zinc-500 mb-3">
                Conditions
              </h2>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {quote.terms}
              </p>
            </section>
          )}

          {/* Version History */}
          {quote.versions && quote.versions.length > 0 && (
            <section className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
              <h2 className="text-xs font-medium text-zinc-500 mb-4">
                Historique des versions
              </h2>
              <div className="space-y-3">
                {quote.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xs font-medium text-accent bg-accent-muted px-2 py-0.5 rounded-md">
                        v{version.version}
                      </span>
                      <span className="text-xs text-zinc-500">
                        par {version.changedBy.name}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-600">
                      {formatDateTime(version.changedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Total summary at bottom */}
          <section className="bg-accent/10 border border-accent/20 rounded-xl p-6 flex items-center justify-between">
            <div>
              <span className="text-2xs text-zinc-500 block mb-1">
                Total du devis
              </span>
              <span className="text-sm font-semibold text-zinc-100">
                {quote.reference}
              </span>
            </div>
            <span className="text-2xl font-bold text-zinc-100 tabular-nums">
              {formatCurrency(quote.total)}
            </span>
          </section>
        </div>
      </div>
    </div>
  );
}
