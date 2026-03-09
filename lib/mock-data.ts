import { Contact, Company, Deal, Project, Invoice, Activity } from "@/types";

// ── Contacts ────────────────────────────────────────────────
export const contacts: Contact[] = [
  { id: "c1", firstName: "Marie", lastName: "Dupont", email: "marie@lvmh.com", phone: "+33 1 44 13 22 22", companyId: "co1", position: "Directrice Marketing", notes: "Contact principal LVMH", status: "active", createdAt: "2024-09-15", updatedAt: "2025-01-10" },
  { id: "c2", firstName: "Jean", lastName: "Petit", email: "jean@kering.com", phone: "+33 1 45 64 61 00", companyId: "co2", position: "Brand Manager", notes: "", status: "active", createdAt: "2024-10-01", updatedAt: "2025-01-20" },
  { id: "c3", firstName: "Sophie", lastName: "Laurent", email: "sophie@hermes.com", phone: "+33 1 40 17 49 20", companyId: "co3", position: "Head of Digital", notes: "Préfère les calls le matin", status: "active", createdAt: "2024-08-20", updatedAt: "2025-02-01" },
  { id: "c4", firstName: "Lucas", lastName: "Martin", email: "lucas@chanel.com", phone: "+33 1 44 50 70 00", companyId: "co4", position: "Creative Director", notes: "", status: "inactive", createdAt: "2024-07-10", updatedAt: "2024-12-15" },
  { id: "c5", firstName: "Emma", lastName: "Bernard", email: "emma@dior.com", phone: "+33 1 40 73 73 73", companyId: "co5", position: "PR Manager", notes: "En charge des relations presse", status: "active", createdAt: "2024-11-05", updatedAt: "2025-02-10" },
  { id: "c6", firstName: "Antoine", lastName: "Moreau", email: "antoine@cartier.com", phone: "+33 1 58 18 11 00", companyId: "co6", position: "Digital Director", notes: "", status: "active", createdAt: "2024-12-01", updatedAt: "2025-02-15" },
  { id: "c7", firstName: "Camille", lastName: "Roux", email: "camille@balenciaga.com", phone: "+33 1 47 20 21 11", companyId: "co7", position: "Marketing Manager", notes: "Nouveau contact depuis Q4", status: "active", createdAt: "2025-01-05", updatedAt: "2025-02-20" },
  { id: "c8", firstName: "Thomas", lastName: "Garnier", email: "thomas@saintlaurent.com", phone: "+33 1 42 65 74 59", companyId: "co8", position: "CMO", notes: "", status: "active", createdAt: "2024-06-15", updatedAt: "2025-01-30" },
];

// ── Companies ───────────────────────────────────────────────
export const companies: Company[] = [
  { id: "co1", name: "LVMH", domain: "lvmh.com", industry: "Luxe", size: "10000+", address: "22 Avenue Montaigne", city: "Paris", country: "France", notes: "Groupe leader mondial du luxe", createdAt: "2024-06-01", updatedAt: "2025-01-10" },
  { id: "co2", name: "Kering", domain: "kering.com", industry: "Luxe", size: "5000+", address: "40 Rue de Sèvres", city: "Paris", country: "France", notes: "Gucci, Saint Laurent, Balenciaga", createdAt: "2024-06-15", updatedAt: "2025-01-20" },
  { id: "co3", name: "Hermès", domain: "hermes.com", industry: "Luxe", size: "1000+", address: "24 Rue du Faubourg Saint-Honoré", city: "Paris", country: "France", notes: "", createdAt: "2024-07-01", updatedAt: "2025-02-01" },
  { id: "co4", name: "Chanel", domain: "chanel.com", industry: "Luxe", size: "5000+", address: "31 Rue Cambon", city: "Paris", country: "France", notes: "Marque iconique", createdAt: "2024-07-10", updatedAt: "2024-12-15" },
  { id: "co5", name: "Dior", domain: "dior.com", industry: "Luxe", size: "5000+", address: "30 Avenue Montaigne", city: "Paris", country: "France", notes: "Partie du groupe LVMH", createdAt: "2024-08-01", updatedAt: "2025-02-10" },
  { id: "co6", name: "Cartier", domain: "cartier.com", industry: "Joaillerie", size: "1000+", address: "13 Rue de la Paix", city: "Paris", country: "France", notes: "Richemont group", createdAt: "2024-09-01", updatedAt: "2025-02-15" },
  { id: "co7", name: "Balenciaga", domain: "balenciaga.com", industry: "Luxe", size: "1000+", address: "10 Avenue George V", city: "Paris", country: "France", notes: "Kering group", createdAt: "2024-10-01", updatedAt: "2025-02-20" },
  { id: "co8", name: "Saint Laurent", domain: "ysl.com", industry: "Luxe", size: "1000+", address: "37 Rue de Bellechasse", city: "Paris", country: "France", notes: "Kering group", createdAt: "2024-06-15", updatedAt: "2025-01-30" },
];

// ── Deals ───────────────────────────────────────────────────
export const deals: Deal[] = [
  { id: "d1", title: "Campagne Luxe Q1", value: 45000, currency: "EUR", stage: "proposal", probability: 60, contactId: "c1", companyId: "co1", ownerId: "1", expectedCloseDate: "2025-03-31", notes: "Campagne multi-canal print + digital", createdAt: "2025-01-05", updatedAt: "2025-02-10" },
  { id: "d2", title: "Refonte Brand Identity", value: 78000, currency: "EUR", stage: "negotiation", probability: 80, contactId: "c2", companyId: "co2", ownerId: "1", expectedCloseDate: "2025-04-15", notes: "Refonte complète guidelines brand", createdAt: "2024-12-01", updatedAt: "2025-02-20" },
  { id: "d3", title: "Content Strategy", value: 32000, currency: "EUR", stage: "qualified", probability: 40, contactId: "c3", companyId: "co3", ownerId: "1", expectedCloseDate: "2025-05-01", notes: "Stratégie contenu social + editorial", createdAt: "2025-01-15", updatedAt: "2025-02-15" },
  { id: "d4", title: "Digital Campaign", value: 56000, currency: "EUR", stage: "lead", probability: 10, contactId: "c4", companyId: "co4", ownerId: "1", expectedCloseDate: "2025-06-30", notes: "", createdAt: "2025-02-01", updatedAt: "2025-02-01" },
  { id: "d5", title: "SEO Audit", value: 18000, currency: "EUR", stage: "lead", probability: 20, contactId: "c5", companyId: "co5", ownerId: "1", expectedCloseDate: "2025-04-30", notes: "Audit SEO technique + contenu", createdAt: "2025-02-05", updatedAt: "2025-02-05" },
  { id: "d6", title: "Brand Audit", value: 24000, currency: "EUR", stage: "won", probability: 100, contactId: "c3", companyId: "co3", ownerId: "1", expectedCloseDate: "2025-02-01", closedAt: "2025-01-28", notes: "Complété", createdAt: "2024-10-15", updatedAt: "2025-01-28" },
  { id: "d7", title: "Social Media Management", value: 36000, currency: "EUR", stage: "won", probability: 100, contactId: "c1", companyId: "co1", ownerId: "1", expectedCloseDate: "2024-12-15", closedAt: "2024-12-10", notes: "Contrat annuel", createdAt: "2024-09-01", updatedAt: "2024-12-10" },
  { id: "d8", title: "E-commerce Redesign", value: 92000, currency: "EUR", stage: "lost", probability: 0, contactId: "c4", companyId: "co4", ownerId: "1", expectedCloseDate: "2025-01-31", closedAt: "2025-01-20", notes: "Perdu face à concurrent", createdAt: "2024-11-01", updatedAt: "2025-01-20" },
  { id: "d9", title: "Influence Marketing", value: 28000, currency: "EUR", stage: "proposal", probability: 50, contactId: "c6", companyId: "co6", ownerId: "1", expectedCloseDate: "2025-04-30", notes: "", createdAt: "2025-02-10", updatedAt: "2025-02-15" },
  { id: "d10", title: "Pop-up Event Branding", value: 41000, currency: "EUR", stage: "negotiation", probability: 75, contactId: "c7", companyId: "co7", ownerId: "1", expectedCloseDate: "2025-03-15", notes: "Event Fashion Week", createdAt: "2025-01-20", updatedAt: "2025-02-18" },
];

// ── Projects ────────────────────────────────────────────────
export const projects: Project[] = [
  { id: "p1", title: "Campagne Luxe Q1", description: "Campagne multi-canal print + digital pour LVMH", status: "active", companyId: "co1", dealId: "d1", startDate: "2025-02-01", endDate: "2025-03-31", budget: 45000, createdAt: "2025-02-01", updatedAt: "2025-02-20" },
  { id: "p2", title: "Refonte Brand Identity", description: "Refonte complète des guidelines brand Kering", status: "active", companyId: "co2", dealId: "d2", startDate: "2025-01-15", endDate: "2025-04-15", budget: 78000, createdAt: "2025-01-15", updatedAt: "2025-02-18" },
  { id: "p3", title: "Content Strategy Hermès", description: "Stratégie contenu social + editorial", status: "planning", companyId: "co3", dealId: "d3", startDate: "2025-03-01", endDate: "2025-06-01", budget: 32000, createdAt: "2025-02-15", updatedAt: "2025-02-15" },
  { id: "p4", title: "Brand Audit Hermès", description: "Audit complet de la marque Hermès", status: "completed", companyId: "co3", dealId: "d6", startDate: "2024-11-01", endDate: "2025-01-28", budget: 24000, createdAt: "2024-11-01", updatedAt: "2025-01-28" },
  { id: "p5", title: "Social Media LVMH", description: "Gestion réseaux sociaux LVMH", status: "active", companyId: "co1", dealId: "d7", startDate: "2024-12-15", endDate: "2025-12-15", budget: 36000, createdAt: "2024-12-15", updatedAt: "2025-02-10" },
  { id: "p6", title: "Digital Campaign Chanel", description: "Campagne digitale Chanel", status: "on_hold", companyId: "co4", dealId: "d4", startDate: "2025-03-01", endDate: "2025-06-30", budget: 56000, createdAt: "2025-02-01", updatedAt: "2025-02-20" },
];

// ── Invoices ────────────────────────────────────────────────
export const invoices: Invoice[] = [
  { id: "inv1", number: "INV-2025-001", projectId: "p4", companyId: "co3", amount: 12000, currency: "EUR", status: "paid", dueDate: "2025-02-15", paidAt: "2025-02-10", createdAt: "2025-01-28", updatedAt: "2025-02-10" },
  { id: "inv2", number: "INV-2025-002", projectId: "p4", companyId: "co3", amount: 12000, currency: "EUR", status: "paid", dueDate: "2025-01-28", paidAt: "2025-01-25", createdAt: "2024-12-28", updatedAt: "2025-01-25" },
  { id: "inv3", number: "INV-2025-003", projectId: "p1", companyId: "co1", amount: 15000, currency: "EUR", status: "sent", dueDate: "2025-03-15", createdAt: "2025-02-15", updatedAt: "2025-02-15" },
  { id: "inv4", number: "INV-2025-004", projectId: "p2", companyId: "co2", amount: 25000, currency: "EUR", status: "sent", dueDate: "2025-03-01", createdAt: "2025-02-01", updatedAt: "2025-02-01" },
  { id: "inv5", number: "INV-2025-005", projectId: "p5", companyId: "co1", amount: 3000, currency: "EUR", status: "overdue", dueDate: "2025-02-01", createdAt: "2025-01-01", updatedAt: "2025-02-20" },
  { id: "inv6", number: "INV-2025-006", projectId: "p5", companyId: "co1", amount: 3000, currency: "EUR", status: "paid", dueDate: "2025-01-01", paidAt: "2024-12-28", createdAt: "2024-12-01", updatedAt: "2024-12-28" },
  { id: "inv7", number: "INV-2025-007", projectId: "p6", companyId: "co4", amount: 28000, currency: "EUR", status: "draft", dueDate: "2025-04-01", createdAt: "2025-02-20", updatedAt: "2025-02-20" },
];

// ── Activities ──────────────────────────────────────────────
export const activities: Activity[] = [
  { id: "a1", type: "call", title: "Appel avec Marie Dupont", description: "Discussion campagne Q1, validation brief", contactId: "c1", companyId: "co1", dealId: "d1", userId: "1", scheduledAt: "2025-02-20T14:30:00", completedAt: "2025-02-20T15:00:00", createdAt: "2025-02-19" },
  { id: "a2", type: "meeting", title: "Review Brand Strategy Kering", description: "Présentation moodboards et direction créative", contactId: "c2", companyId: "co2", dealId: "d2", userId: "1", scheduledAt: "2025-02-20T10:00:00", completedAt: "2025-02-20T11:30:00", createdAt: "2025-02-18" },
  { id: "a3", type: "email", title: "Envoi proposition commerciale Hermès", description: "Proposition content strategy", contactId: "c3", companyId: "co3", dealId: "d3", userId: "1", scheduledAt: "2025-02-19T16:45:00", completedAt: "2025-02-19T16:45:00", createdAt: "2025-02-19" },
  { id: "a4", type: "task", title: "Préparer deck présentation Chanel", description: "Deck pour pitch digital campaign", contactId: "c4", companyId: "co4", dealId: "d4", userId: "1", scheduledAt: "2025-02-21T09:00:00", createdAt: "2025-02-18" },
  { id: "a5", type: "note", title: "Notes réunion stratégie Q2", description: "Points clés : budget, timeline, KPIs", contactId: "c5", companyId: "co5", userId: "1", completedAt: "2025-02-19T11:00:00", createdAt: "2025-02-19" },
  { id: "a6", type: "call", title: "Follow-up proposal Cartier", description: "Relance suite envoi proposition influence", contactId: "c6", companyId: "co6", dealId: "d9", userId: "1", scheduledAt: "2025-02-21T15:00:00", createdAt: "2025-02-20" },
  { id: "a7", type: "meeting", title: "Kick-off Balenciaga Event", description: "Lancement projet pop-up Fashion Week", contactId: "c7", companyId: "co7", dealId: "d10", userId: "1", scheduledAt: "2025-02-22T10:00:00", createdAt: "2025-02-20" },
  { id: "a8", type: "email", title: "Envoi facture LVMH", description: "Facture INV-2025-003", companyId: "co1", userId: "1", completedAt: "2025-02-15T14:00:00", createdAt: "2025-02-15" },
  { id: "a9", type: "call", title: "Point mensuel Saint Laurent", description: "Review performance social media", contactId: "c8", companyId: "co8", userId: "1", scheduledAt: "2025-02-25T11:00:00", createdAt: "2025-02-20" },
  { id: "a10", type: "task", title: "Mise à jour pipeline CRM", description: "Actualiser les deals et probabilités", userId: "1", completedAt: "2025-02-20T09:00:00", createdAt: "2025-02-20" },
];
