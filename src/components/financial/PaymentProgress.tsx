"use client";

import React from "react";

interface PaymentProgressProps {
  total: number;
  paid: number;
  showLabels?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function PaymentProgress({ total, paid, showLabels = true }: PaymentProgressProps) {
  const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const isComplete = paid >= total;
  const fillColor = isComplete ? "bg-success" : "bg-warning";

  return (
    <div className="w-full">
      <div className="flex justify-center mb-1">
        <span className={`text-xs font-medium tabular-nums ${isComplete ? "text-success" : "text-zinc-400"}`}>
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-zinc-800 w-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${fillColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between mt-1.5">
          <span className="text-2xs text-zinc-500">
            Paye <span className="text-zinc-300 tabular-nums">{formatCurrency(paid)}</span>
          </span>
          <span className="text-2xs text-zinc-500">
            Total <span className="text-zinc-300 tabular-nums">{formatCurrency(total)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export { PaymentProgress };
export type { PaymentProgressProps };
