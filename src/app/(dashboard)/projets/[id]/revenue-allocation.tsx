"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Percent, Save, Loader2 } from "lucide-react";

// ============================================
// Types
// ============================================

interface Allocation {
  month: string; // "YYYY-MM"
  percentage: number;
  amount: number;
  notes?: string;
}

interface RevenueAllocationsResponse {
  allocations: Allocation[];
  totalRevenue: number;
}

interface RevenueAllocationProps {
  projectId: string;
  startDate?: string | null;
  endDate?: string | null;
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

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const MONTHS = [
    "JAN",
    "FEV",
    "MAR",
    "AVR",
    "MAI",
    "JUN",
    "JUL",
    "AOU",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const monthIndex = parseInt(m, 10) - 1;
  return `${MONTHS[monthIndex]} ${year}`;
}

function generateMonthRange(start: string | null | undefined, end: string | null | undefined): string[] {
  const months: string[] = [];

  // Default: current month +/- 2 months if no dates provided
  const now = new Date();
  const startDate = start ? new Date(start) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = end ? new Date(end) : new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= last) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
  }

  // Ensure at least one month
  if (months.length === 0) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }

  return months;
}

// ============================================
// Component
// ============================================

export default function RevenueAllocation({ projectId, startDate, endDate }: RevenueAllocationProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [allocations, setAllocations] = useState<Record<string, { percentage: number; notes: string }>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generate months from project dates
  const months = useMemo(() => generateMonthRange(startDate, endDate), [startDate, endDate]);

  // Fetch existing allocations
  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/revenue-allocations`);
      const json = await res.json();
      if (json.success) {
        const data: RevenueAllocationsResponse = json.data;
        setTotalRevenue(data.totalRevenue);

        // Build allocations map
        const map: Record<string, { percentage: number; notes: string }> = {};
        for (const month of months) {
          const existing = data.allocations.find((a) => a.month === month);
          map[month] = {
            percentage: existing ? existing.percentage : 0,
            notes: existing?.notes || "",
          };
        }
        setAllocations(map);
      }
    } catch (err) {
      console.error("Failed to fetch revenue allocations:", err);
      // Initialize empty allocations
      const map: Record<string, { percentage: number; notes: string }> = {};
      for (const month of months) {
        map[month] = { percentage: 0, notes: "" };
      }
      setAllocations(map);
    } finally {
      setLoading(false);
    }
  }, [projectId, months]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  // Total percentage
  const totalPercentage = useMemo(() => {
    return Object.values(allocations).reduce((sum, a) => sum + a.percentage, 0);
  }, [allocations]);

  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  // Update allocation for a month
  const updateAllocation = (month: string, percentage: number) => {
    setAllocations((prev) => ({
      ...prev,
      [month]: { ...prev[month], percentage: Math.max(0, Math.min(100, percentage)) },
    }));
    setSaveSuccess(false);
  };

  // Distribute equally
  const distributeEqually = () => {
    const count = months.length;
    if (count === 0) return;
    const perMonth = Math.floor((100 / count) * 100) / 100;
    const remainder = Math.round((100 - perMonth * count) * 100) / 100;

    const newAllocations = { ...allocations };
    months.forEach((month, index) => {
      newAllocations[month] = {
        ...newAllocations[month],
        percentage: index === 0 ? perMonth + remainder : perMonth,
      };
    });
    setAllocations(newAllocations);
    setSaveSuccess(false);
  };

  // Save allocations
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const allocationList = months
        .filter((month) => allocations[month]?.percentage > 0)
        .map((month) => ({
          month,
          percentage: allocations[month].percentage,
          notes: allocations[month].notes || undefined,
        }));

      const res = await fetch(`/api/projects/${projectId}/revenue-allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations: allocationList }),
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save allocations:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent size={14} className="text-accent" />
          <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
            REPARTITION DU CA
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={16} className="animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500 ml-2">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Percent size={14} className="text-accent" />
          <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
            REPARTITION DU CA
          </h3>
        </div>
        <button
          onClick={distributeEqually}
          className="text-2xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Repartir egalement
        </button>
      </div>

      {/* Total Revenue */}
      <div className="mb-5 p-3 bg-accent/5 border border-accent/20 rounded-lg">
        <div className="text-2xs text-zinc-500 font-medium mb-0.5">CA Total du projet</div>
        <div className="text-lg font-bold text-zinc-100 tabular-nums">
          {formatCurrency(totalRevenue)}
        </div>
      </div>

      {/* Allocations Table */}
      <div className="space-y-0 mb-4">
        {/* Header */}
        <div className="grid grid-cols-[120px_1fr_120px] gap-3 pb-2 border-b border-zinc-800/50">
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">
            MOIS
          </div>
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">
            POURCENTAGE
          </div>
          <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 text-right">
            MONTANT
          </div>
        </div>

        {/* Rows */}
        {months.map((month) => {
          const alloc = allocations[month] || { percentage: 0, notes: "" };
          const amount = Math.round(totalRevenue * (alloc.percentage / 100) * 100) / 100;

          return (
            <div
              key={month}
              className="grid grid-cols-[120px_1fr_120px] gap-3 items-center py-2.5 border-b border-zinc-800/30"
            >
              <div className="text-sm font-medium text-zinc-300">
                {formatMonthLabel(month)}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={alloc.percentage}
                  onChange={(e) => updateAllocation(month, parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3.5
                    [&::-webkit-slider-thumb]:h-3.5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-accent
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-glow
                    [&::-webkit-slider-track]:rounded-full
                    [&::-webkit-slider-track]:bg-zinc-800
                    [&::-moz-range-thumb]:w-3.5
                    [&::-moz-range-thumb]:h-3.5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-accent
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-track]:rounded-full
                    [&::-moz-range-track]:bg-zinc-800
                    [&::-moz-range-track]:h-1.5"
                  style={{
                    background: `linear-gradient(to right, #8B5CF6 ${alloc.percentage}%, #27272A ${alloc.percentage}%)`,
                  }}
                />
                <input
                  type="number"
                  value={alloc.percentage}
                  onChange={(e) =>
                    updateAllocation(month, parseFloat(e.target.value) || 0)
                  }
                  min={0}
                  max={100}
                  step={0.5}
                  className="w-16 px-2 py-1 text-xs text-right bg-surface border border-zinc-800/50 rounded text-zinc-100 outline-none focus:border-accent transition-colors tabular-nums"
                />
                <span className="text-xs text-zinc-500 w-4">%</span>
              </div>
              <div className="text-sm text-zinc-300 text-right tabular-nums font-medium">
                {formatCurrency(amount)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Bar + Save */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-400">Total:</span>
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-32 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isValid ? "bg-success" : totalPercentage > 100 ? "bg-danger" : "bg-warning"
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              />
            </div>
            <span
              className={`text-sm font-bold tabular-nums ${
                isValid ? "text-success" : totalPercentage > 100 ? "text-danger" : "text-warning"
              }`}
            >
              {totalPercentage.toFixed(1)}%
            </span>
          </div>
          {!isValid && totalPercentage > 0 && (
            <span className="text-2xs text-warning">
              {totalPercentage < 100
                ? `${(100 - totalPercentage).toFixed(1)}% restant`
                : `${(totalPercentage - 100).toFixed(1)}% en trop`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-2xs text-success font-medium">Enregistre</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
              saving
                ? "opacity-40 cursor-not-allowed bg-accent text-white"
                : "bg-accent text-white hover:bg-accent-hover shadow-glow"
            }`}
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
