"use client";

import React, { useCallback, useMemo } from "react";
import { Plus, Trash2, CheckCircle2, Clock, FileText } from "lucide-react";

// ============================================
// Types
// ============================================

interface Milestone {
  id?: string;
  label: string;
  percentage: number;
  position: number;
  invoiceId?: string | null;
  invoice?: {
    id: string;
    reference: string;
    status: string;
    total: string | number;
  } | null;
}

interface MilestoneEditorProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  readOnly?: boolean;
  quoteTotal?: number;
  currency?: string;
}

// ============================================
// Helpers
// ============================================

function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const STANDARD_PRESETS: Omit<Milestone, "position">[] = [
  { label: "Acompte commande", percentage: 30 },
  { label: "Fin production", percentage: 40 },
  { label: "Livraison finale", percentage: 30 },
];

// ============================================
// Component
// ============================================

function MilestoneEditor({
  milestones,
  onChange,
  readOnly = false,
  quoteTotal = 0,
  currency = "EUR",
}: MilestoneEditorProps) {
  const totalPercentage = useMemo(
    () => milestones.reduce((sum, m) => sum + m.percentage, 0),
    [milestones]
  );

  const isValidTotal = Math.abs(totalPercentage - 100) <= 0.01;

  const handleLabelChange = useCallback(
    (index: number, value: string) => {
      const updated = [...milestones];
      updated[index] = { ...updated[index], label: value };
      onChange(updated);
    },
    [milestones, onChange]
  );

  const handlePercentageChange = useCallback(
    (index: number, value: string) => {
      const updated = [...milestones];
      const numValue = parseFloat(value) || 0;
      updated[index] = { ...updated[index], percentage: numValue };
      onChange(updated);
    },
    [milestones, onChange]
  );

  const handleAdd = useCallback(() => {
    const newMilestone: Milestone = {
      label: "",
      percentage: 0,
      position: milestones.length + 1,
    };
    onChange([...milestones, newMilestone]);
  }, [milestones, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const updated = milestones
        .filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, position: i + 1 }));
      onChange(updated);
    },
    [milestones, onChange]
  );

  const handlePreset = useCallback(() => {
    const preset: Milestone[] = STANDARD_PRESETS.map((p, i) => ({
      ...p,
      position: i + 1,
    }));
    onChange(preset);
  }, [onChange]);

  // ============================================
  // Read-only mode: cards with status
  // ============================================
  if (readOnly) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Echeances de facturation
          </h4>
          <span className="text-2xs text-zinc-600 tabular-nums">
            {milestones.length} echeance{milestones.length > 1 ? "s" : ""}
          </span>
        </div>

        {milestones.map((milestone, index) => {
          const amount = quoteTotal * (milestone.percentage / 100);
          const isInvoiced = !!milestone.invoiceId;

          return (
            <div
              key={milestone.id || `milestone-${index}`}
              className={`
                rounded-lg border p-4 transition-colors
                ${
                  isInvoiced
                    ? "bg-success/5 border-success/20"
                    : "bg-surface-raised border-zinc-800/50"
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-lg shrink-0
                      ${
                        isInvoiced
                          ? "bg-success/10 text-success"
                          : "bg-zinc-800/50 text-zinc-500"
                      }
                    `}
                  >
                    {isInvoiced ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {milestone.label}
                    </p>
                    <p className="text-2xs text-zinc-500 mt-0.5">
                      {milestone.percentage}% du devis
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-100 tabular-nums">
                    {formatCurrency(amount, currency)}
                  </p>
                  {isInvoiced && milestone.invoice && (
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      <FileText size={11} className="text-success" />
                      <span className="text-2xs text-success font-medium">
                        {milestone.invoice.reference}
                      </span>
                    </div>
                  )}
                  {!isInvoiced && (
                    <span className="text-2xs text-zinc-600 mt-1 inline-block">
                      En attente
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Progress bar */}
        {milestones.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-800/50">
            <div className="flex items-center justify-between text-2xs text-zinc-500 mb-2">
              <span>Progression de facturation</span>
              <span className="tabular-nums">
                {milestones.filter((m) => m.invoiceId).length}/
                {milestones.length} facturee
                {milestones.filter((m) => m.invoiceId).length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{
                  width: `${
                    milestones.length > 0
                      ? (milestones.filter((m) => m.invoiceId).length /
                          milestones.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // Edit mode: inputs
  // ============================================
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Echeances de facturation
        </h4>
        <button
          type="button"
          onClick={handlePreset}
          className="text-2xs text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Repartition standard
        </button>
      </div>

      {/* Header row */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-[1fr_100px_120px_40px] gap-2 text-2xs font-medium text-zinc-500 border-b border-zinc-800/50 pb-2">
          <div>Libelle</div>
          <div className="text-right">%</div>
          <div className="text-right">Montant</div>
          <div />
        </div>
      )}

      {/* Milestone rows */}
      {milestones.map((milestone, index) => {
        const amount = quoteTotal * (milestone.percentage / 100);
        const isLocked = !!milestone.invoiceId;

        return (
          <div
            key={milestone.id || `milestone-edit-${index}`}
            className={`
              group grid grid-cols-[1fr_100px_120px_40px] gap-2 items-center py-2
              ${isLocked ? "opacity-60" : ""}
            `}
          >
            <div>
              {isLocked ? (
                <span className="text-sm text-zinc-400">{milestone.label}</span>
              ) : (
                <input
                  type="text"
                  value={milestone.label}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  placeholder="Ex: Acompte commande"
                  className="w-full bg-transparent border-0 border-b border-transparent focus:border-zinc-700 outline-none text-sm text-zinc-200 py-1 placeholder:text-zinc-700 transition-colors"
                />
              )}
            </div>

            <div>
              {isLocked ? (
                <span className="block text-right text-sm text-zinc-400 tabular-nums">
                  {milestone.percentage}%
                </span>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    value={milestone.percentage}
                    onChange={(e) =>
                      handlePercentageChange(index, e.target.value)
                    }
                    min={0}
                    max={100}
                    step={0.01}
                    className="w-full bg-transparent border-0 border-b border-transparent focus:border-zinc-700 outline-none text-sm text-zinc-200 py-1 text-right tabular-nums transition-colors pr-5"
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xs text-zinc-600">
                    %
                  </span>
                </div>
              )}
            </div>

            <div className="text-right text-sm font-medium text-zinc-300 tabular-nums">
              {formatCurrency(amount, currency)}
            </div>

            <div className="flex items-center justify-center">
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-danger-muted rounded"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {isLocked && (
                <CheckCircle2
                  size={14}
                  className="text-success"
                  aria-label="Facturee"
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        className="text-accent text-xs font-medium flex items-center gap-2 py-2 px-1 hover:bg-accent-muted rounded-lg transition-colors"
      >
        <Plus size={14} />
        Ajouter une echeance
      </button>

      {/* Total percentage summary */}
      {milestones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">Total des echeances</span>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isValidTotal ? "text-success" : "text-warning"
                }`}
              >
                {totalPercentage.toFixed(2)}%
              </span>
              {quoteTotal > 0 && (
                <span className="text-sm text-zinc-400 tabular-nums">
                  {formatCurrency(
                    quoteTotal * (totalPercentage / 100),
                    currency
                  )}
                </span>
              )}
            </div>
          </div>

          {!isValidTotal && (
            <p className="text-2xs text-warning mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-warning" />
              Le total des pourcentages doit etre egal a 100%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { MilestoneEditor };
export type { Milestone, MilestoneEditorProps };
