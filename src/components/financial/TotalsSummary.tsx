"use client";

import React from "react";

interface TotalsSummaryProps {
  subtotal: number;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED";
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  currency?: string;
  taxBreakdown?: { rate: number; base: number; amount: number }[];
}

function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

function TotalsSummary({
  subtotal,
  discount,
  discountType,
  taxRate,
  taxAmount,
  total,
  amountPaid,
  amountDue,
  currency = "EUR",
  taxBreakdown,
}: TotalsSummaryProps) {
  const discountLabel = discountType === "PERCENTAGE" ? `Remise (${discount}%)` : "Remise";
  const discountValue = discountType === "PERCENTAGE" ? subtotal * (discount / 100) : discount;

  return (
    <div className="w-72 ml-auto">
      <div className="flex justify-between py-1.5">
        <span className="text-xs text-zinc-500">Sous-total</span>
        <span className="text-xs text-zinc-200 font-medium tabular-nums">
          {formatCurrency(subtotal, currency)}
        </span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between py-1.5">
          <span className="text-xs text-zinc-500">{discountLabel}</span>
          <span className="text-xs text-danger font-medium tabular-nums">
            -{formatCurrency(discountValue, currency)}
          </span>
        </div>
      )}

      <div className="border-t border-zinc-800/50 my-2" />

      {taxBreakdown && taxBreakdown.length > 1 ? (
        taxBreakdown.map((entry) => (
          <div key={entry.rate} className="flex justify-between py-1.5">
            <span className="text-xs text-zinc-500">TVA {entry.rate}%</span>
            <span className="text-xs text-zinc-200 font-medium tabular-nums">
              {formatCurrency(entry.amount, currency)}
            </span>
          </div>
        ))
      ) : (
        <div className="flex justify-between py-1.5">
          <span className="text-xs text-zinc-500">TVA ({taxRate}%)</span>
          <span className="text-xs text-zinc-200 font-medium tabular-nums">
            {formatCurrency(taxAmount, currency)}
          </span>
        </div>
      )}

      <div className="border-t border-zinc-700 pt-3 mt-2">
        <div className="flex justify-between">
          <span className="text-lg font-bold text-zinc-100">Total</span>
          <span className="text-lg font-bold text-zinc-100 tabular-nums">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>

      {amountPaid !== undefined && (
        <>
          <div className="border-t border-zinc-800/50 my-2" />
          <div className="flex justify-between py-1.5">
            <span className="text-xs text-success">Paye</span>
            <span className="text-xs text-success font-medium tabular-nums">
              {formatCurrency(amountPaid, currency)}
            </span>
          </div>
          {amountDue !== undefined && amountDue > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-danger">Reste du</span>
              <span className="text-xs text-danger font-medium tabular-nums">
                {formatCurrency(amountDue, currency)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { TotalsSummary };
export type { TotalsSummaryProps };
