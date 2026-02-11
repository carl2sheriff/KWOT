"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FinancialCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
}

const iconColorMap: Record<NonNullable<FinancialCardProps["variant"]>, string> = {
  default: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

function FinancialCard({
  label,
  value,
  icon,
  trend,
  variant = "default",
  onClick,
}: FinancialCardProps) {
  return (
    <div
      className={[
        "bg-surface-raised border border-zinc-800/50 rounded-xl p-5 transition-all duration-150 relative group",
        onClick ? "hover:border-accent/30 cursor-pointer hover:shadow-lg hover:shadow-accent/5" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className={`absolute top-5 right-5 ${iconColorMap[variant]} opacity-60 group-hover:opacity-100 transition-opacity`}>
        <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
      </div>

      <div className="text-xs text-zinc-500 mb-1.5">{label}</div>
      <div className="text-xl font-bold text-zinc-100 tabular-nums">{value}</div>

      {trend && (
        <div
          className={[
            "flex items-center gap-1 mt-1.5 text-2xs font-medium",
            trend.isPositive ? "text-success" : "text-danger",
          ].join(" ")}
        >
          {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span className="tabular-nums">
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}

export { FinancialCard };
export type { FinancialCardProps };
