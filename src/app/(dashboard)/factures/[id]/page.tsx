"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { generateLegalMentions } from "@/lib/format";
import Header from "@/components/layout/Header";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { TotalsSummary } from "@/components/financial/TotalsSummary";
import { PaymentProgress } from "@/components/financial/PaymentProgress";
import {
  ArrowLeft,
  Send,
  CreditCard,
  Receipt,
  Calendar,
  Building2,
  AlertCircle,
  Trash2,
  Edit3,
  Check,
  ExternalLink,
  Download,
} from "lucide-react";

// ============================================
// Types
// ============================================

interface InvoiceDetail {
  id: string;
  reference: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  discount: string | number;
  total: string | number;
  amountPaid: string | number;
  amountDue: string | number;
  clientPONumber: string | null;
  situationNumber: number | null;
  situationTotal: number | null;
  notes: string | null;
  terms: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
  };
  project: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  seller: { id: string; name: string } | null;
  salesBu: { id: string; name: string; code: string } | null;
  quote: { id: string; reference: string } | null;
  items: InvoiceItem[];
  payments: PaymentItem[];
  schedule: ScheduleItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discount: string | number;
  total: string | number;
  position: number;
  product: { id: string; name: string; sku: string } | null;
  productiveBu: { id: string; name: string; code: string } | null;
}

interface PaymentItem {
  id: string;
  reference: string;
  amount: string | number;
  method: string;
  status: string;
  paidAt: string | null;
  notes: string | null;
  isDeposit: boolean;
  createdAt: string;
  receivedBy: { id: string; name: string };
}

interface ScheduleItem {
  id: string;
  installmentNumber: number;
  amount: string | number;
  dueDate: string;
  status: string;
  paidAt: string | null;
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
// StatusBadge
// ============================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "BROUILLON", className: "bg-[#F5F5F5] text-[#999]" },
    SENT: { label: "ENVOYE", className: "bg-[#FFA839]/10 text-[#FFA839]" },
    PAID: { label: "PAYE", className: "bg-[#00F816]/10 text-[#00F816]" },
    PARTIALLY_PAID: {
      label: "PART. PAYE",
      className: "bg-[#FFA839]/10 text-[#FFA839]",
    },
    OVERDUE: { label: "EN RETARD", className: "bg-[#FF00C4]/10 text-[#FF00C4]" },
    CANCELLED: { label: "ANNULE", className: "bg-[#F5F5F5] text-[#999]" },
    CREDITED: { label: "CREDITE", className: "bg-[#F5F5F5] text-[#999]" },
    PENDING: { label: "EN ATTENTE", className: "bg-[#FFA839]/10 text-[#FFA839]" },
    COMPLETED: { label: "COMPLETE", className: "bg-[#00F816]/10 text-[#00F816]" },
    FAILED: { label: "ECHOUE", className: "bg-[#FF00C4]/10 text-[#FF00C4]" },
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
// Method Label Map
// ============================================

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "VIREMENT",
  CHECK: "CHEQUE",
  CARD: "CB",
  CASH: "ESPECES",
  OTHER: "AUTRE",
};

// ============================================
// Payment Recording Modal
// ============================================

function PaymentModal({
  isOpen,
  onClose,
  invoiceId,
  maxAmount,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  maxAmount: number;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(maxAmount.toFixed(2));
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAmount(maxAmount.toFixed(2));
  }, [maxAmount]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          amount: parseFloat(amount),
          method,
          paidAt: new Date(paidAt),
          notes: notes || undefined,
          isDeposit: false,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Erreur lors de l'enregistrement");
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
    <Modal isOpen={isOpen} onClose={onClose} title="ENREGISTRER UN PAIEMENT" size="md">
      <div className="space-y-4">
        {error && (
          <div className="bg-[#FF00C4]/10 text-[#FF00C4] text-[11px] font-bold px-4 py-2 rounded-[10px]">
            {error}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
            MONTANT
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            max={maxAmount}
            className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors tabular-nums"
          />
          <div className="text-[10px] text-[#999] mt-1">
            Maximum: {formatCurrency(maxAmount)}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
            METHODE
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors bg-white"
          >
            <option value="BANK_TRANSFER">VIREMENT BANCAIRE</option>
            <option value="CHECK">CHEQUE</option>
            <option value="CARD">CARTE BANCAIRE</option>
            <option value="CASH">ESPECES</option>
            <option value="OTHER">AUTRE</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
            DATE DE PAIEMENT
          </label>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1.5">
            NOTES
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-[13px] border border-[#E5E5E5] rounded-[10px] outline-none focus:border-[#3C01FC] transition-colors resize-none"
            placeholder="Notes optionnelles..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[11px] font-bold tracking-[0.1em] uppercase text-[#999] hover:text-black transition-colors"
          >
            ANNULER
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || parseFloat(amount) <= 0}
            className="flex items-center gap-2 bg-[#00F816] text-black text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] hover:bg-[#00F816]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check size={14} />
            {submitting ? "ENREGISTREMENT..." : "ENREGISTRER"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// Main Page
// ============================================

export default function FactureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [legalMentions, setLegalMentions] = useState<string[]>([]);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const json = await res.json();
      if (json.success) {
        setInvoice(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Fetch company settings for legal mentions
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings/company");
        const json = await res.json();
        if (json.success && json.data) {
          const s = json.data;
          const mentions = generateLegalMentions({
            latePenaltyRate: s.latePenaltyRate ? parseFloat(s.latePenaltyRate) : null,
            earlyPaymentDiscount: s.earlyPaymentDiscount,
            defaultPaymentTerms: s.defaultPaymentTerms,
            legalForm: s.legalForm,
            shareCapital: s.shareCapital,
            siren: s.siren,
            rcsNumber: s.rcsNumber,
            rcsCity: s.rcsCity,
            tvaIntracom: s.tvaIntracom,
            companyName: s.companyName,
          });
          setLegalMentions(mentions);
        }
      } catch {
        // Silently fail - legal mentions are not critical
      }
    }
    fetchSettings();
  }, []);

  const handleSend = async () => {
    if (!confirm("Marquer cette facture comme envoyee ?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        fetchInvoice();
      }
    } catch (err) {
      console.error("Failed to send invoice:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette facture ? Cette action est irreversible.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        router.push("/factures");
      }
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}/pdf`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice?.reference || 'facture'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="FACTURE" subtitle="Chargement..." />
        <div className="flex-1 flex items-center justify-center">
          <Loading message="CHARGEMENT" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col h-full">
        <Header title="FACTURE" subtitle="Introuvable" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[13px] font-bold text-black mb-2">
              FACTURE INTROUVABLE
            </div>
            <button
              onClick={() => router.push("/factures")}
              className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#3C01FC] hover:underline"
            >
              RETOUR AUX FACTURES
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOverdue =
    new Date(invoice.dueDate) < new Date() &&
    !["PAID", "CANCELLED", "CREDITED"].includes(invoice.status);
  const displayStatus = isOverdue ? "OVERDUE" : invoice.status;
  const canRecordPayment = ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(displayStatus);
  const amountDue = toNumber(invoice.amountDue);

  return (
    <div className="flex flex-col h-full">
      <Header
        title={invoice.reference}
        subtitle={invoice.client.name}
        actions={
          <div className="flex items-center gap-2">
            {/* Back */}
            <button
              onClick={() => router.push("/factures")}
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-[#999] hover:text-black px-3 py-2 rounded-[10px] hover:bg-[#F5F5F5] transition-colors"
            >
              <ArrowLeft size={14} />
              RETOUR
            </button>

            {/* PDF Download */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-[#F5F5F5] text-black text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] hover:bg-[#E5E5E5] transition-colors"
            >
              <Download size={14} />
              PDF
            </button>

            {/* DRAFT Actions */}
            {invoice.status === "DRAFT" && (
              <>
                <button
                  onClick={handleSend}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-[#3C01FC] text-white text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] hover:bg-[#3C01FC]/80 disabled:opacity-40 transition-colors"
                >
                  <Send size={14} />
                  ENVOYER
                </button>
                <button
                  onClick={() => router.push(`/factures/nouveau?edit=${id}`)}
                  className="flex items-center gap-2 bg-[#F5F5F5] text-black text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] hover:bg-[#E5E5E5] transition-colors"
                >
                  <Edit3 size={14} />
                  MODIFIER
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-[#FF00C4]/10 text-[#FF00C4] text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] hover:bg-[#FF00C4]/20 disabled:opacity-40 transition-colors"
                >
                  <Trash2 size={14} />
                  SUPPRIMER
                </button>
              </>
            )}

            {/* SENT / PARTIALLY_PAID / OVERDUE Actions */}
            {canRecordPayment && (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className={`flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-[10px] transition-colors ${
                  isOverdue
                    ? "bg-[#FF00C4] text-white hover:bg-[#FF00C4]/80"
                    : "bg-[#00F816] text-black hover:bg-[#00F816]/80"
                }`}
              >
                <CreditCard size={14} />
                ENREGISTRER PAIEMENT
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Status + Payment Progress Row */}
        <div className="flex items-start gap-6 mb-6">
          {/* Invoice Status */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={displayStatus} />
              {isOverdue && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#FF00C4]">
                  <AlertCircle size={12} />
                  ECHEANCE DEPASSEE
                </span>
              )}
            </div>

            {/* Situation indicator */}
            {invoice.situationNumber && invoice.situationTotal && (
              <div className="mb-4 px-3 py-2 bg-[#3C01FC]/10 text-[#3C01FC] rounded-[10px] text-[11px] font-bold tracking-[0.05em]">
                Facture de situation {invoice.situationNumber}/{invoice.situationTotal}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                  REFERENCE
                </div>
                <div className="text-[13px] font-bold text-black">
                  {invoice.reference}
                </div>
              </div>
              {invoice.clientPONumber && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                    N° BC CLIENT
                  </div>
                  <div className="text-[13px] font-bold text-black">
                    {invoice.clientPONumber}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                  <Building2 size={10} className="inline mr-1" />
                  CLIENT
                </div>
                <div className="text-[13px] font-bold text-black">
                  {invoice.client.name}
                </div>
                {invoice.client.company && (
                  <div className="text-[11px] text-[#999]">
                    {invoice.client.company}
                  </div>
                )}
              </div>
              {invoice.project && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                    PROJET
                  </div>
                  <div className="text-[13px] font-bold text-black">
                    {invoice.project.name}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                  <Calendar size={10} className="inline mr-1" />
                  DATE EMISSION
                </div>
                <div className="text-[13px] text-black">
                  {formatDate(invoice.issueDate)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                  <Calendar size={10} className="inline mr-1" />
                  DATE ECHEANCE
                </div>
                <div
                  className={`text-[13px] ${
                    isOverdue ? "text-[#FF00C4] font-bold" : "text-black"
                  }`}
                >
                  {formatDate(invoice.dueDate)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                  CREE PAR
                </div>
                <div className="text-[13px] text-black">
                  {invoice.createdBy.name}
                </div>
              </div>
              {invoice.seller && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                    VENDEUR
                  </div>
                  <div className="text-[13px] font-bold text-black">
                    {invoice.seller.name}
                  </div>
                </div>
              )}
              {invoice.salesBu && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                    BU VENTE
                  </div>
                  <div className="text-[13px] font-bold text-black">
                    {invoice.salesBu.name}
                    <span className="text-[10px] text-[#999] ml-1.5 font-mono">
                      {invoice.salesBu.code}
                    </span>
                  </div>
                </div>
              )}
              {invoice.quote && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-1">
                    DEVIS LIE
                  </div>
                  <button
                    onClick={() => router.push(`/devis/${invoice.quote!.id}`)}
                    className="flex items-center gap-1 text-[13px] text-[#3C01FC] font-bold hover:underline"
                  >
                    {invoice.quote.reference}
                    <ExternalLink size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Progress */}
          <div className="w-52 bg-white border border-[#E5E5E5] rounded-[12px] p-4">
            <PaymentProgress
              total={toNumber(invoice.total)}
              paid={toNumber(invoice.amountPaid)}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#999] mb-4">
            <Receipt size={12} className="inline mr-1.5" />
            ARTICLES
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_80px_80px_120px_100px_120px] gap-2 text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] border-b border-[#E5E5E5] pb-2">
            <div>#</div>
            <div>DESCRIPTION</div>
            <div>BU PROD.</div>
            <div className="text-right">QTE</div>
            <div className="text-right">PRIX UNIT.</div>
            <div className="text-right">REMISE</div>
            <div className="text-right">TOTAL</div>
          </div>

          {/* Items */}
          {invoice.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[40px_1fr_80px_80px_120px_100px_120px] gap-2 text-[13px] py-3 border-b border-[#F5F5F5] items-center"
            >
              <div className="text-[11px] font-bold text-[#999]">{item.position}</div>
              <div>
                <div className="font-medium">{item.description}</div>
                {item.product && (
                  <div className="text-[10px] text-[#999]">
                    SKU: {item.product.sku}
                  </div>
                )}
              </div>
              <div>
                {item.productiveBu ? (
                  <span className="text-[10px] font-mono font-bold tracking-wider text-[#999] bg-[#F5F5F5] px-1.5 py-0.5 rounded">
                    {item.productiveBu.code}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#CCC]">-</span>
                )}
              </div>
              <div className="text-right tabular-nums">
                {toNumber(item.quantity).toFixed(2)}
              </div>
              <div className="text-right tabular-nums">
                {formatCurrency(item.unitPrice)}
              </div>
              <div className="text-right tabular-nums">
                {toNumber(item.discount) > 0
                  ? formatCurrency(item.discount)
                  : "-"}
              </div>
              <div className="text-right font-bold tabular-nums">
                {formatCurrency(item.total)}
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-6">
            <TotalsSummary
              subtotal={toNumber(invoice.subtotal)}
              discount={toNumber(invoice.discount)}
              discountType="PERCENTAGE"
              taxRate={toNumber(invoice.taxRate)}
              taxAmount={toNumber(invoice.taxAmount)}
              total={toNumber(invoice.total)}
              amountPaid={toNumber(invoice.amountPaid)}
              amountDue={toNumber(invoice.amountDue)}
            />
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#999] mb-4">
              <CreditCard size={12} className="inline mr-1.5" />
              HISTORIQUE DES PAIEMENTS ({invoice.payments.length})
            </div>

            <div className="space-y-0">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-[#F5F5F5] last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[11px] font-bold text-black">
                        {payment.reference}
                      </div>
                      <div className="text-[10px] text-[#999]">
                        {payment.paidAt ? formatDate(payment.paidAt) : "-"}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] uppercase border border-[#E5E5E5] rounded-[10px] text-[#666]">
                      {METHOD_LABELS[payment.method] || payment.method}
                    </span>
                    <StatusBadge status={payment.status} />
                    {payment.isDeposit && (
                      <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#3C01FC]">
                        ACOMPTE
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-black tabular-nums text-[#00F816]">
                    +{formatCurrency(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Schedule */}
        {invoice.schedule.length > 0 && (
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#999] mb-4">
              <Calendar size={12} className="inline mr-1.5" />
              ECHEANCIER DE PAIEMENT
            </div>

            {/* Schedule Header */}
            <div className="grid grid-cols-[60px_1fr_120px_120px] gap-3 text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] border-b border-[#E5E5E5] pb-2">
              <div>#</div>
              <div>MONTANT</div>
              <div>DATE</div>
              <div>STATUT</div>
            </div>

            {/* Schedule Rows */}
            {invoice.schedule.map((sched) => {
              const schedOverdue =
                sched.status === "pending" && new Date(sched.dueDate) < new Date();
              return (
                <div
                  key={sched.id}
                  className={`grid grid-cols-[60px_1fr_120px_120px] gap-3 items-center py-3 border-b border-[#F5F5F5] last:border-b-0 ${
                    schedOverdue ? "bg-[#FF00C4]/5" : ""
                  }`}
                >
                  <div className="text-[11px] font-bold text-[#999]">
                    #{sched.installmentNumber}
                  </div>
                  <div className="text-[13px] font-bold tabular-nums">
                    {formatCurrency(sched.amount)}
                  </div>
                  <div
                    className={`text-[11px] ${
                      schedOverdue ? "text-[#FF00C4] font-bold" : "text-[#666]"
                    }`}
                  >
                    {formatDate(sched.dueDate)}
                  </div>
                  <div>
                    <StatusBadge
                      status={
                        schedOverdue
                          ? "OVERDUE"
                          : sched.status === "paid"
                          ? "PAID"
                          : "PENDING"
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 mb-6">
            <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#999] mb-2">
              NOTES
            </div>
            <div className="text-[13px] text-[#666] whitespace-pre-wrap">
              {invoice.notes}
            </div>
          </div>
        )}

        {/* Legal Mentions */}
        {legalMentions.length > 0 && (
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-[12px] p-6">
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#999] mb-3">
              MENTIONS LEGALES
            </div>
            <ul className="space-y-1.5">
              {legalMentions.map((mention, index) => (
                <li
                  key={index}
                  className="text-[11px] text-[#999] leading-relaxed"
                >
                  {mention}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoiceId={id}
        maxAmount={amountDue}
        onSuccess={fetchInvoice}
      />
    </div>
  );
}
