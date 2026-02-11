"use client";

import React from "react";
import { X } from "lucide-react";

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
  label?: string;
}

function DateRangePicker({ from, to, onChange, label }: DateRangePickerProps) {
  const hasValues = from || to;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          {label}
        </label>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-2xs text-zinc-500 mb-1">Du</label>
          <input
            type="date"
            value={from || ""}
            onChange={(e) => onChange(e.target.value || null, to)}
            className={[
              "w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm outline-none transition-colors",
              !from ? "text-zinc-600" : "text-zinc-200",
            ].join(" ")}
          />
        </div>

        <div className="flex-1">
          <label className="block text-2xs text-zinc-500 mb-1">Au</label>
          <input
            type="date"
            value={to || ""}
            onChange={(e) => onChange(from, e.target.value || null)}
            min={from || undefined}
            className={[
              "w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2 text-sm outline-none transition-colors",
              !to ? "text-zinc-600" : "text-zinc-200",
            ].join(" ")}
          />
        </div>

        {hasValues && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="flex items-center justify-center w-9 h-9 text-zinc-500 hover:text-danger transition-colors rounded-lg hover:bg-danger-muted shrink-0"
            aria-label="Effacer"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export { DateRangePicker };
export type { DateRangePickerProps };
