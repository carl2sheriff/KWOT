// ── Contact ──────────────────────────────────────────────
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId?: string;
  position?: string;
  notes?: string;
  avatarUrl?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

// ── Company ──────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Deal ─────────────────────────────────────────────────
export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  contactId?: string;
  companyId?: string;
  ownerId: string;
  expectedCloseDate?: string;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Project ──────────────────────────────────────────────
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  companyId?: string;
  dealId?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Invoice ──────────────────────────────────────────────
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  number: string;
  projectId?: string;
  companyId?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Activity ─────────────────────────────────────────────
export type ActivityType = "call" | "email" | "meeting" | "note" | "task";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  projectId?: string;
  userId: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}
