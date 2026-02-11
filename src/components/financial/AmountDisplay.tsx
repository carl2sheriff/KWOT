"use client";

import React from "react";

interface AmountDisplayProps {
  amount: number | string;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  negative?: boolean;
}

const sizeStyles: Record<NonNullable<AmountDisplayProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-2xl font-bold",
};

function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

function AmountDisplay({
  amount,
  currency = "EUR",
  size = "md",
  className = "",
  negative,
}: AmountDisplayProps) {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  const isNegative = negative ?? numericAmount < 0;
  const displayAmount = isNegative && numericAmount > 0 ? -numericAmount : numericAmount;

  return (
    <span
      className={[
        "tabular-nums font-semibold",
        sizeStyles[size],
        isNegative ? "text-danger" : "text-zinc-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {formatCurrency(displayAmount, currency)}
    </span>
  );
}

export { AmountDisplay };
export type { AmountDisplayProps };
