"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { BadgeProps } from "@/components/ui/Badge";

interface StatusBadgeProps {
  status: string;
  type?: "quote" | "invoice" | "payment" | "po";
}

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  draft: "Brouillon",
  SENT: "Envoye",
  APPROVED: "Approuve",
  CONFIRMED: "Confirme",
  REJECTED: "Refuse",
  EXPIRED: "Expire",
  CANCELLED: "Annule",
  PAID: "Paye",
  PARTIALLY_PAID: "Part. paye",
  OVERDUE: "En retard",
  PENDING: "En attente",
  COMPLETED: "Complete",
  FAILED: "Echoue",
  REFUNDED: "Rembourse",
  CREDITED: "Credite",
  RECEIVED: "Recu",
  APPLIED: "Applique",
};

function getStatusVariant(status: string): BadgeVariant {
  const s = status.toUpperCase();
  switch (s) {
    case "APPROVED":
    case "CONFIRMED":
    case "PAID":
    case "COMPLETED":
    case "RECEIVED":
    case "APPLIED":
      return "success";
    case "SENT":
    case "PARTIALLY_PAID":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
    case "FAILED":
    case "EXPIRED":
    case "OVERDUE":
      return "danger";
    case "PENDING":
      return "accent";
    case "DRAFT":
      return "muted";
    default:
      return "outline";
  }
}

function StatusBadge({ status, type: _type }: StatusBadgeProps) {
  const variant = getStatusVariant(status);
  const label = STATUS_LABELS[status] || STATUS_LABELS[status.toUpperCase()] || status;

  return <Badge variant={variant}>{label}</Badge>;
}

export { StatusBadge };
export type { StatusBadgeProps };
