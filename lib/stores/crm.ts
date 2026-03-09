import { create } from "zustand";
import { Contact, Company, Deal, DealStage, Project, Invoice, Activity } from "@/types";
import { contacts as mockContacts, companies as mockCompanies, deals as mockDeals, projects as mockProjects, invoices as mockInvoices, activities as mockActivities } from "@/lib/mock-data";

interface CrmState {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  projects: Project[];
  invoices: Invoice[];
  activities: Activity[];

  // Contacts
  addContact: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt">) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  // Companies
  addCompany: (company: Omit<Company, "id" | "createdAt" | "updatedAt">) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  // Deals
  addDeal: (deal: Omit<Deal, "id" | "createdAt" | "updatedAt">) => void;
  updateDeal: (id: string, data: Partial<Deal>) => void;
  moveDeal: (id: string, stage: DealStage) => void;
  deleteDeal: (id: string) => void;

  // Projects
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Invoices
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Activities
  addActivity: (activity: Omit<Activity, "id" | "createdAt">) => void;
  completeActivity: (id: string) => void;
  deleteActivity: (id: string) => void;

  // Helpers
  getContactById: (id: string) => Contact | undefined;
  getCompanyById: (id: string) => Company | undefined;
  getDealById: (id: string) => Deal | undefined;
  getProjectById: (id: string) => Project | undefined;
  getContactsByCompany: (companyId: string) => Contact[];
  getDealsByCompany: (companyId: string) => Deal[];
  getDealsByContact: (contactId: string) => Deal[];
  getProjectsByCompany: (companyId: string) => Project[];
  getInvoicesByCompany: (companyId: string) => Invoice[];
  getActivitiesByContact: (contactId: string) => Activity[];
  getActivitiesByCompany: (companyId: string) => Activity[];
}

const now = () => new Date().toISOString();
let nextId = 100;
const genId = (prefix: string) => `${prefix}${nextId++}`;

export const useCrmStore = create<CrmState>((set, get) => ({
  contacts: mockContacts,
  companies: mockCompanies,
  deals: mockDeals,
  projects: mockProjects,
  invoices: mockInvoices,
  activities: mockActivities,

  // ── Contacts ──────────────────────────────────────────
  addContact: (data) =>
    set((s) => ({
      contacts: [...s.contacts, { ...data, id: genId("c"), createdAt: now(), updatedAt: now() }],
    })),
  updateContact: (id, data) =>
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...data, updatedAt: now() } : c)),
    })),
  deleteContact: (id) =>
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

  // ── Companies ─────────────────────────────────────────
  addCompany: (data) =>
    set((s) => ({
      companies: [...s.companies, { ...data, id: genId("co"), createdAt: now(), updatedAt: now() }],
    })),
  updateCompany: (id, data) =>
    set((s) => ({
      companies: s.companies.map((c) => (c.id === id ? { ...c, ...data, updatedAt: now() } : c)),
    })),
  deleteCompany: (id) =>
    set((s) => ({ companies: s.companies.filter((c) => c.id !== id) })),

  // ── Deals ─────────────────────────────────────────────
  addDeal: (data) =>
    set((s) => ({
      deals: [...s.deals, { ...data, id: genId("d"), createdAt: now(), updatedAt: now() }],
    })),
  updateDeal: (id, data) =>
    set((s) => ({
      deals: s.deals.map((d) => (d.id === id ? { ...d, ...data, updatedAt: now() } : d)),
    })),
  moveDeal: (id, stage) =>
    set((s) => ({
      deals: s.deals.map((d) =>
        d.id === id
          ? { ...d, stage, updatedAt: now(), ...(stage === "won" || stage === "lost" ? { closedAt: now() } : {}) }
          : d
      ),
    })),
  deleteDeal: (id) =>
    set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),

  // ── Projects ──────────────────────────────────────────
  addProject: (data) =>
    set((s) => ({
      projects: [...s.projects, { ...data, id: genId("p"), createdAt: now(), updatedAt: now() }],
    })),
  updateProject: (id, data) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data, updatedAt: now() } : p)),
    })),
  deleteProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  // ── Invoices ──────────────────────────────────────────
  addInvoice: (data) =>
    set((s) => ({
      invoices: [...s.invoices, { ...data, id: genId("inv"), createdAt: now(), updatedAt: now() }],
    })),
  updateInvoice: (id, data) =>
    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...data, updatedAt: now() } : i)),
    })),
  deleteInvoice: (id) =>
    set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),

  // ── Activities ────────────────────────────────────────
  addActivity: (data) =>
    set((s) => ({
      activities: [...s.activities, { ...data, id: genId("a"), createdAt: now() }],
    })),
  completeActivity: (id) =>
    set((s) => ({
      activities: s.activities.map((a) =>
        a.id === id ? { ...a, completedAt: now() } : a
      ),
    })),
  deleteActivity: (id) =>
    set((s) => ({ activities: s.activities.filter((a) => a.id !== id) })),

  // ── Helpers ───────────────────────────────────────────
  getContactById: (id) => get().contacts.find((c) => c.id === id),
  getCompanyById: (id) => get().companies.find((c) => c.id === id),
  getDealById: (id) => get().deals.find((d) => d.id === id),
  getProjectById: (id) => get().projects.find((p) => p.id === id),
  getContactsByCompany: (companyId) => get().contacts.filter((c) => c.companyId === companyId),
  getDealsByCompany: (companyId) => get().deals.filter((d) => d.companyId === companyId),
  getDealsByContact: (contactId) => get().deals.filter((d) => d.contactId === contactId),
  getProjectsByCompany: (companyId) => get().projects.filter((p) => p.companyId === companyId),
  getInvoicesByCompany: (companyId) => get().invoices.filter((i) => i.companyId === companyId),
  getActivitiesByContact: (contactId) => get().activities.filter((a) => a.contactId === contactId),
  getActivitiesByCompany: (companyId) => get().activities.filter((a) => a.companyId === companyId),
}));
