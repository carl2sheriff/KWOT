"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loading } from "@/components/ui/Loading";
import { Save, Building2, Calculator, FileText, Hash, Scale, Landmark, ScrollText, RefreshCw, CheckCircle2, XCircle, Plug, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface CompanySettings {
  id: string;
  companyName: string;
  legalForm: string | null;
  shareCapital: string | null;
  siret: string | null;
  siren: string | null;
  rcsNumber: string | null;
  rcsCity: string | null;
  tvaIntracom: string | null;
  apeCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  iban: string | null;
  bic: string | null;
  latePenaltyRate: string | number | null;
  earlyPaymentDiscount: string | null;
  legalFooter: string | null;
  defaultTaxRate: string | number;
  defaultPaymentTerms: number;
  quotePrefix: string;
  invoicePrefix: string;
  creditNotePrefix: string;
  poPrefix: string;
  paymentPrefix: string;
  nextQuoteNumber: number;
  nextInvoiceNumber: number;
  nextCreditNoteNumber: number;
  nextPONumber: number;
  nextPaymentNumber: number;
  currency: string;
  locale: string;
  acAccountId: string | null;
  acApiToken: string | null;
  acSyncEnabled: boolean;
  acLastSyncAt: string | null;
}

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count?: { invoicesSales?: number; invoiceItemsProductive?: number };
}

export default function SettingsPage() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Business Units
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [buLoading, setBuLoading] = useState(true);
  const [showBuForm, setShowBuForm] = useState(false);
  const [buFormName, setBuFormName] = useState("");
  const [buFormCode, setBuFormCode] = useState("");
  const [buSaving, setBuSaving] = useState(false);
  const [editingBuId, setEditingBuId] = useState<string | null>(null);
  const [editBuName, setEditBuName] = useState("");
  const [editBuCode, setEditBuCode] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [shareCapital, setShareCapital] = useState("");
  const [siret, setSiret] = useState("");
  const [siren, setSiren] = useState("");
  const [rcsNumber, setRcsNumber] = useState("");
  const [rcsCity, setRcsCity] = useState("");
  const [tvaIntracom, setTvaIntracom] = useState("");
  const [apeCode, setApeCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [latePenaltyRate, setLatePenaltyRate] = useState<number | "">("");
  const [earlyPaymentDiscount, setEarlyPaymentDiscount] = useState("");
  const [legalFooter, setLegalFooter] = useState("");
  const [defaultTaxRate, setDefaultTaxRate] = useState(20);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(30);
  const [quotePrefix, setQuotePrefix] = useState("DEV");
  const [invoicePrefix, setInvoicePrefix] = useState("FAC");
  const [creditNotePrefix, setCreditNotePrefix] = useState("AV");
  const [poPrefix, setPoPrefix] = useState("PO");
  const [paymentPrefix, setPaymentPrefix] = useState("PAY");
  const [nextQuoteNumber, setNextQuoteNumber] = useState(1);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [nextCreditNoteNumber, setNextCreditNoteNumber] = useState(1);
  const [nextPONumber, setNextPONumber] = useState(1);
  const [nextPaymentNumber, setNextPaymentNumber] = useState(1);

  // ActiveCollab
  const [acAccountId, setAcAccountId] = useState("");
  const [acApiToken, setAcApiToken] = useState("");
  const [acSyncEnabled, setAcSyncEnabled] = useState(false);
  const [acLastSyncAt, setAcLastSyncAt] = useState<string | null>(null);
  const [acTesting, setAcTesting] = useState(false);
  const [acTestResult, setAcTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [acSyncing, setAcSyncing] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings/company");
        const json = await res.json();

        if (json.success) {
          const s: CompanySettings = json.data;
          setCompanyName(s.companyName || "");
          setLegalForm(s.legalForm || "");
          setShareCapital(s.shareCapital || "");
          setSiret(s.siret || "");
          setSiren(s.siren || "");
          setRcsNumber(s.rcsNumber || "");
          setRcsCity(s.rcsCity || "");
          setTvaIntracom(s.tvaIntracom || "");
          setApeCode(s.apeCode || "");
          setAddress(s.address || "");
          setPhone(s.phone || "");
          setEmail(s.email || "");
          setWebsite(s.website || "");
          setIban(s.iban || "");
          setBic(s.bic || "");
          setLatePenaltyRate(
            s.latePenaltyRate != null
              ? typeof s.latePenaltyRate === "string"
                ? parseFloat(s.latePenaltyRate)
                : s.latePenaltyRate
              : ""
          );
          setEarlyPaymentDiscount(s.earlyPaymentDiscount || "");
          setLegalFooter(s.legalFooter || "");
          setDefaultTaxRate(
            typeof s.defaultTaxRate === "string"
              ? parseFloat(s.defaultTaxRate)
              : s.defaultTaxRate
          );
          setDefaultPaymentTerms(s.defaultPaymentTerms);
          setQuotePrefix(s.quotePrefix);
          setInvoicePrefix(s.invoicePrefix);
          setCreditNotePrefix(s.creditNotePrefix || "AV");
          setPoPrefix(s.poPrefix);
          setPaymentPrefix(s.paymentPrefix);
          setNextQuoteNumber(s.nextQuoteNumber);
          setNextInvoiceNumber(s.nextInvoiceNumber);
          setNextCreditNoteNumber(s.nextCreditNoteNumber || 1);
          setNextPONumber(s.nextPONumber);
          setNextPaymentNumber(s.nextPaymentNumber);
          setAcAccountId(s.acAccountId || "");
          setAcApiToken(s.acApiToken || "");
          setAcSyncEnabled(s.acSyncEnabled || false);
          setAcLastSyncAt(s.acLastSyncAt || null);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        toast.error("Erreur de chargement des parametres");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Business Units
  const fetchBusinessUnits = React.useCallback(async () => {
    setBuLoading(true);
    try {
      const res = await fetch("/api/business-units");
      const json = await res.json();
      if (json.success) {
        setBusinessUnits(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch business units:", err);
    } finally {
      setBuLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinessUnits();
  }, [fetchBusinessUnits]);

  const handleCreateBU = async () => {
    if (!buFormName.trim() || !buFormCode.trim()) return;
    setBuSaving(true);
    try {
      const res = await fetch("/api/business-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: buFormName.trim(), code: buFormCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Business Unit creee");
        setBuFormName("");
        setBuFormCode("");
        setShowBuForm(false);
        fetchBusinessUnits();
      } else {
        toast.error(json.error || "Erreur lors de la creation");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setBuSaving(false);
    }
  };

  const handleUpdateBU = async (id: string) => {
    if (!editBuName.trim() || !editBuCode.trim()) return;
    setBuSaving(true);
    try {
      const res = await fetch(`/api/business-units/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editBuName.trim(), code: editBuCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Business Unit mise a jour");
        setEditingBuId(null);
        fetchBusinessUnits();
      } else {
        toast.error(json.error || "Erreur lors de la mise a jour");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setBuSaving(false);
    }
  };

  const handleToggleBU = async (bu: BusinessUnit) => {
    try {
      const res = await fetch(`/api/business-units/${bu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !bu.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(bu.isActive ? "BU desactivee" : "BU activee");
        fetchBusinessUnits();
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleDeleteBU = async (bu: BusinessUnit) => {
    if (!confirm(`Supprimer la BU "${bu.name}" ? Cette action est irreversible.`)) return;
    try {
      const res = await fetch(`/api/business-units/${bu.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Business Unit supprimee");
        fetchBusinessUnits();
      } else {
        toast.error(json.error || "Impossible de supprimer cette BU");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          legalForm: legalForm || "",
          shareCapital: shareCapital || "",
          siret: siret || "",
          siren: siren || "",
          rcsNumber: rcsNumber || "",
          rcsCity: rcsCity || "",
          tvaIntracom: tvaIntracom || "",
          apeCode: apeCode || "",
          address: address || "",
          phone: phone || "",
          email: email || "",
          website: website || "",
          iban: iban || "",
          bic: bic || "",
          ...(latePenaltyRate !== "" && { latePenaltyRate }),
          earlyPaymentDiscount: earlyPaymentDiscount || "",
          legalFooter: legalFooter || "",
          defaultTaxRate,
          defaultPaymentTerms,
          quotePrefix,
          invoicePrefix,
          creditNotePrefix,
          poPrefix,
          paymentPrefix,
          acAccountId: acAccountId || "",
          acApiToken: acApiToken || "",
          acSyncEnabled,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast.success("Parametres enregistres");
      } else {
        toast.error(json.error || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleTestAC = async () => {
    setAcTesting(true);
    setAcTestResult(null);
    try {
      // Save first so test uses latest credentials
      await handleSave();
      const res = await fetch("/api/activecollab/test");
      const json = await res.json();
      if (json.success) {
        setAcTestResult({ ok: true, message: `Connecte - ${json.data.projectCount} projet(s) trouves` });
      } else {
        setAcTestResult({ ok: false, message: json.error || "Erreur de connexion" });
      }
    } catch {
      setAcTestResult({ ok: false, message: "Erreur reseau" });
    } finally {
      setAcTesting(false);
    }
  };

  const handleSyncAC = async () => {
    setAcSyncing(true);
    try {
      const res = await fetch("/api/activecollab/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        toast.success(
          `Synchro terminee: ${d.matched.length} projet(s), ${d.timeRecords.created + d.timeRecords.updated} temps, ${d.expenses.created + d.expenses.updated} depense(s)`
        );
        setAcLastSyncAt(new Date().toISOString());
      } else {
        toast.error(json.error || "Erreur de synchronisation");
      }
    } catch {
      toast.error("Erreur reseau lors de la synchronisation");
    } finally {
      setAcSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Parametres" subtitle="Configuration" />
        <div className="flex-1 flex items-center justify-center">
          <Loading message="Chargement des parametres..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Parametres"
        subtitle="Configuration"
        actions={
          <Button
            variant="accent"
            size="sm"
            icon={<Save size={14} />}
            loading={saving}
            onClick={handleSave}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          {/* Section 1: Company Info */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Building2 size={14} className="text-zinc-500" />
              Informations societe
            </h2>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Nom de la societe
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  SIRET
                </label>
                <input
                  type="text"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 00012"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Telephone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@societe.fr"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Adresse
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Forme juridique
                </label>
                <input
                  type="text"
                  value={legalForm}
                  onChange={(e) => setLegalForm(e.target.value)}
                  placeholder="SAS, SARL, EI..."
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Capital social
                </label>
                <input
                  type="text"
                  value={shareCapital}
                  onChange={(e) => setShareCapital(e.target.value)}
                  placeholder="10 000 EUR"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  SIREN
                </label>
                <input
                  type="text"
                  value={siren}
                  onChange={(e) => setSiren(e.target.value)}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Site web
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Informations legales */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Scale size={14} className="text-zinc-500" />
              Informations legales
            </h2>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Numero RCS
                </label>
                <input
                  type="text"
                  value={rcsNumber}
                  onChange={(e) => setRcsNumber(e.target.value)}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Ville RCS
                </label>
                <input
                  type="text"
                  value={rcsCity}
                  onChange={(e) => setRcsCity(e.target.value)}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  TVA intracommunautaire
                </label>
                <input
                  type="text"
                  value={tvaIntracom}
                  onChange={(e) => setTvaIntracom(e.target.value)}
                  placeholder="FR12345678901"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Code APE/NAF
                </label>
                <input
                  type="text"
                  value={apeCode}
                  onChange={(e) => setApeCode(e.target.value)}
                  placeholder="6201Z"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Coordonnees bancaires */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Landmark size={14} className="text-zinc-500" />
              Coordonnees bancaires
            </h2>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  IBAN
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="FR76 ..."
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  BIC
                </label>
                <input
                  type="text"
                  value={bic}
                  onChange={(e) => setBic(e.target.value)}
                  placeholder="BNPAFRPP"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Parameters */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Calculator size={14} className="text-zinc-500" />
              Parametres financiers
            </h2>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Taux de TVA par defaut (%)
                </label>
                <input
                  type="number"
                  value={defaultTaxRate}
                  onChange={(e) =>
                    setDefaultTaxRate(parseFloat(e.target.value) || 0)
                  }
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Delai de paiement par defaut (jours)
                </label>
                <input
                  type="number"
                  value={defaultPaymentTerms}
                  onChange={(e) =>
                    setDefaultPaymentTerms(parseInt(e.target.value) || 30)
                  }
                  min={1}
                  max={365}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Taux penalite retard (%)
                </label>
                <input
                  type="number"
                  value={latePenaltyRate}
                  onChange={(e) =>
                    setLatePenaltyRate(
                      e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                    )
                  }
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Escompte paiement anticipe
                </label>
                <input
                  type="text"
                  value={earlyPaymentDiscount}
                  onChange={(e) => setEarlyPaymentDiscount(e.target.value)}
                  placeholder="Pas d'escompte pour paiement anticipe"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Mentions legales */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <ScrollText size={14} className="text-zinc-500" />
              Mentions legales
            </h2>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Mentions legales personnalisees
              </label>
              <textarea
                value={legalFooter}
                onChange={(e) => setLegalFooter(e.target.value)}
                rows={4}
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 resize-none"
              />
            </div>
          </div>

          {/* Section: Document Prefixes */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <FileText size={14} className="text-zinc-500" />
              Prefixes documents
            </h2>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prefixe devis
                </label>
                <input
                  type="text"
                  value={quotePrefix}
                  onChange={(e) =>
                    setQuotePrefix(e.target.value.toUpperCase())
                  }
                  maxLength={10}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors font-semibold tracking-wide"
                />
                <span className="text-2xs text-zinc-600 mt-1 block">
                  Ex: {quotePrefix}-2026-0001
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prefixe facture
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) =>
                    setInvoicePrefix(e.target.value.toUpperCase())
                  }
                  maxLength={10}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors font-semibold tracking-wide"
                />
                <span className="text-2xs text-zinc-600 mt-1 block">
                  Ex: {invoicePrefix}-2026-0001
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prefixe bon de commande
                </label>
                <input
                  type="text"
                  value={poPrefix}
                  onChange={(e) =>
                    setPoPrefix(e.target.value.toUpperCase())
                  }
                  maxLength={10}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors font-semibold tracking-wide"
                />
                <span className="text-2xs text-zinc-600 mt-1 block">
                  Ex: {poPrefix}-2026-0001
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prefixe paiement
                </label>
                <input
                  type="text"
                  value={paymentPrefix}
                  onChange={(e) =>
                    setPaymentPrefix(e.target.value.toUpperCase())
                  }
                  maxLength={10}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors font-semibold tracking-wide"
                />
                <span className="text-2xs text-zinc-600 mt-1 block">
                  Ex: {paymentPrefix}-2026-0001
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prefixe avoirs
                </label>
                <input
                  type="text"
                  value={creditNotePrefix}
                  onChange={(e) =>
                    setCreditNotePrefix(e.target.value.toUpperCase())
                  }
                  maxLength={10}
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors font-semibold tracking-wide"
                />
                <span className="text-2xs text-zinc-600 mt-1 block">
                  Ex: {creditNotePrefix}-2026-0001
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Counters */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Hash size={14} className="text-zinc-500" />
              Compteurs
            </h2>

            <p className="text-xs text-zinc-500 mb-4">
              Numero du prochain document a generer. Modifier avec precaution.
            </p>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prochain devis
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={nextQuoteNumber}
                    onChange={(e) =>
                      setNextQuoteNumber(parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors tabular-nums"
                    readOnly
                  />
                  <span className="text-2xs text-zinc-600 whitespace-nowrap">
                    {quotePrefix}-2026-{String(nextQuoteNumber).padStart(4, "0")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prochaine facture
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={nextInvoiceNumber}
                    onChange={(e) =>
                      setNextInvoiceNumber(parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors tabular-nums"
                    readOnly
                  />
                  <span className="text-2xs text-zinc-600 whitespace-nowrap">
                    {invoicePrefix}-2026-
                    {String(nextInvoiceNumber).padStart(4, "0")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prochain bon de commande
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={nextPONumber}
                    onChange={(e) =>
                      setNextPONumber(parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors tabular-nums"
                    readOnly
                  />
                  <span className="text-2xs text-zinc-600 whitespace-nowrap">
                    {poPrefix}-2026-{String(nextPONumber).padStart(4, "0")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prochain paiement
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={nextPaymentNumber}
                    onChange={(e) =>
                      setNextPaymentNumber(parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors tabular-nums"
                    readOnly
                  />
                  <span className="text-2xs text-zinc-600 whitespace-nowrap">
                    {paymentPrefix}-2026-
                    {String(nextPaymentNumber).padStart(4, "0")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Prochain avoir
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={nextCreditNoteNumber}
                    onChange={(e) =>
                      setNextCreditNoteNumber(parseInt(e.target.value) || 1)
                    }
                    min={1}
                    className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors tabular-nums"
                    readOnly
                  />
                  <span className="text-2xs text-zinc-600 whitespace-nowrap">
                    {creditNotePrefix}-2026-
                    {String(nextCreditNoteNumber).padStart(4, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Business Units */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Building2 size={14} className="text-zinc-500" />
                Business Units
              </h2>
              {!showBuForm && (
                <button
                  onClick={() => setShowBuForm(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  <Plus size={12} />
                  Ajouter une BU
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-500 mb-4">
              Gerez les Business Units pour le suivi du CA par entite.
            </p>

            {/* Add BU Form */}
            {showBuForm && (
              <div className="border border-accent/30 rounded-lg p-4 mb-4 bg-accent/5">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-1">
                      NOM
                    </label>
                    <input
                      type="text"
                      value={buFormName}
                      onChange={(e) => setBuFormName(e.target.value)}
                      placeholder="Ex: Production"
                      className="w-full px-3 py-2 text-sm bg-surface border border-zinc-800/50 rounded-lg text-zinc-100 outline-none focus:border-accent transition-colors placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-1">
                      CODE
                    </label>
                    <input
                      type="text"
                      value={buFormCode}
                      onChange={(e) => setBuFormCode(e.target.value.toUpperCase())}
                      placeholder="Ex: PROD"
                      maxLength={10}
                      className="w-full px-3 py-2 text-sm bg-surface border border-zinc-800/50 rounded-lg text-zinc-100 outline-none focus:border-accent transition-colors placeholder:text-zinc-600 font-mono tracking-wider"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleCreateBU}
                    loading={buSaving}
                    disabled={!buFormName.trim() || !buFormCode.trim()}
                  >
                    Creer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBuForm(false);
                      setBuFormName("");
                      setBuFormCode("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* BU List */}
            {buLoading ? (
              <div className="text-xs text-zinc-500 py-4 text-center">Chargement...</div>
            ) : businessUnits.length === 0 ? (
              <div className="text-xs text-zinc-500 py-4 text-center border border-zinc-800/30 rounded-lg border-dashed">
                Aucune Business Unit configuree
              </div>
            ) : (
              <div className="space-y-0 border border-zinc-800/50 rounded-lg overflow-hidden">
                {businessUnits.map((bu) => (
                  <div
                    key={bu.id}
                    className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/30 last:border-b-0 hover:bg-zinc-800/20 transition-colors"
                  >
                    {editingBuId === bu.id ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="text"
                          value={editBuName}
                          onChange={(e) => setEditBuName(e.target.value)}
                          className="px-2 py-1 text-sm bg-surface border border-zinc-800/50 rounded text-zinc-100 outline-none focus:border-accent transition-colors w-40"
                        />
                        <input
                          type="text"
                          value={editBuCode}
                          onChange={(e) => setEditBuCode(e.target.value.toUpperCase())}
                          maxLength={10}
                          className="px-2 py-1 text-sm bg-surface border border-zinc-800/50 rounded text-zinc-100 outline-none focus:border-accent transition-colors w-24 font-mono tracking-wider"
                        />
                        <button
                          onClick={() => handleUpdateBU(bu.id)}
                          disabled={buSaving}
                          className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingBuId(null)}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-zinc-200">{bu.name}</span>
                          <span className="text-2xs font-mono font-bold tracking-wider text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
                            {bu.code}
                          </span>
                          <span
                            className={`text-2xs font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded ${
                              bu.isActive
                                ? "bg-success/10 text-success"
                                : "bg-zinc-800/50 text-zinc-600"
                            }`}
                          >
                            {bu.isActive ? "ACTIF" : "INACTIF"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingBuId(bu.id);
                              setEditBuName(bu.name);
                              setEditBuCode(bu.code);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleToggleBU(bu)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded transition-colors"
                            title={bu.isActive ? "Desactiver" : "Activer"}
                          >
                            {bu.isActive ? <ToggleRight size={14} className="text-success" /> : <ToggleLeft size={14} />}
                          </button>
                          <button
                            onClick={() => handleDeleteBU(bu)}
                            className="p-1.5 text-zinc-500 hover:text-danger hover:bg-danger/10 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: ActiveCollab */}
          <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Plug size={14} className="text-zinc-500" />
              ActiveCollab
            </h2>

            <p className="text-xs text-zinc-500 mb-4">
              Synchronisez les temps et depenses depuis ActiveCollab Cloud.
            </p>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Account ID
                </label>
                <input
                  type="text"
                  value={acAccountId}
                  onChange={(e) => setAcAccountId(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
                <span className="text-2xs text-zinc-600 mt-1 block">
                  Visible dans l&apos;URL: app.activecollab.com/<strong>123456</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Token API
                </label>
                <input
                  type="password"
                  value={acApiToken}
                  onChange={(e) => setAcApiToken(e.target.value)}
                  placeholder="Votre token API"
                  className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
                />
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acSyncEnabled}
                    onChange={(e) => setAcSyncEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
                </label>
                <span className="text-sm text-zinc-300">Synchronisation active</span>
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestAC}
                  loading={acTesting}
                  disabled={!acAccountId || !acApiToken}
                >
                  {acTesting ? "Test..." : "Tester la connexion"}
                </Button>

                <Button
                  variant="accent"
                  size="sm"
                  icon={<RefreshCw size={14} className={acSyncing ? "animate-spin" : ""} />}
                  onClick={handleSyncAC}
                  loading={acSyncing}
                  disabled={!acAccountId || !acApiToken}
                >
                  {acSyncing ? "Synchronisation..." : "Synchroniser maintenant"}
                </Button>

                {acTestResult && (
                  <span className={`text-xs flex items-center gap-1 ${acTestResult.ok ? "text-success" : "text-danger"}`}>
                    {acTestResult.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {acTestResult.message}
                  </span>
                )}
              </div>

              {acLastSyncAt && (
                <div className="col-span-2">
                  <span className="text-2xs text-zinc-600">
                    Derniere synchronisation: {new Date(acLastSyncAt).toLocaleString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Save Button */}
          <div className="flex justify-end pb-6">
            <Button
              variant="accent"
              size="sm"
              icon={<Save size={14} />}
              loading={saving}
              onClick={handleSave}
            >
              {saving ? "Enregistrement..." : "Enregistrer les parametres"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
