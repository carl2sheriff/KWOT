import { z } from 'zod'

// ============================================
// SHARED SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
})

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'prospect']).default('active'),
})

export const updateClientSchema = createClientSchema.partial()

// ============================================
// QUOTE SCHEMAS
// ============================================

const quoteItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().min(0.01, 'Quantite min 0.01'),
  unitPrice: z.coerce.number().min(0, 'Prix min 0'),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  section: z.string().max(100).optional().or(z.literal('')),
})

const milestoneSchema = z.object({
  label: z.string().min(1).max(200),
  percentage: z.coerce.number().min(0).max(100),
})

export const createQuoteSchema = z.object({
  clientId: z.string().uuid('Client requis'),
  projectId: z.string().uuid().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  discount: z.coerce.number().min(0).default(0),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  notes: z.string().max(5000).optional().or(z.literal('')),
  terms: z.string().max(5000).optional().or(z.literal('')),
  clientPONumber: z.string().max(100).optional().or(z.literal('')),
  items: z.array(quoteItemSchema).min(1, 'Au moins un article requis'),
  milestones: z.array(milestoneSchema).optional(),
})

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  items: z.array(quoteItemSchema).min(1, 'Au moins un article requis').optional(),
})

export const updateQuoteStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED']),
})

// ============================================
// INVOICE SCHEMAS
// ============================================

const invoiceItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  section: z.string().max(100).optional().or(z.literal('')),
})

export const createInvoiceSchema = z.object({
  quoteId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid('Client requis'),
  projectId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date(),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().max(5000).optional().or(z.literal('')),
  terms: z.string().max(5000).optional().or(z.literal('')),
  clientPONumber: z.string().max(100).optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'Au moins un article requis'),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

// ============================================
// CREDIT NOTE SCHEMAS
// ============================================

const creditNoteItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100).default(20),
})

export const createCreditNoteSchema = z.object({
  invoiceId: z.string().uuid('Facture requise'),
  reason: z.string().max(2000).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  items: z.array(creditNoteItemSchema).min(1, 'Au moins un article requis'),
})

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Facture requise'),
  amount: z.coerce.number().min(0.01, 'Montant min 0.01'),
  method: z.enum(['BANK_TRANSFER', 'CHECK', 'CARD', 'CASH', 'OTHER']).default('BANK_TRANSFER'),
  paidAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  isDeposit: z.boolean().default(false),
})

export const updatePaymentSchema = createPaymentSchema.partial()

// ============================================
// PAYMENT SCHEDULE SCHEMAS
// ============================================

const scheduleInstallmentSchema = z.object({
  amount: z.coerce.number().min(0.01),
  dueDate: z.coerce.date(),
})

export const createPaymentScheduleSchema = z.object({
  invoiceId: z.string().uuid('Facture requise'),
  installments: z.array(scheduleInstallmentSchema).min(2, 'Min 2 echeances'),
})

// ============================================
// PURCHASE ORDER SCHEMAS
// ============================================

const poItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Fournisseur requis'),
  projectId: z.string().uuid().optional().nullable(),
  expectedDelivery: z.coerce.date().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  notes: z.string().max(5000).optional().or(z.literal('')),
  items: z.array(poItemSchema).min(1, 'Au moins un article requis'),
})

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial()

// ============================================
// SUPPLIER SCHEMAS
// ============================================

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  siret: z.string().max(20).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const updateSupplierSchema = createSupplierSchema.partial()

// ============================================
// COMPANY SETTINGS SCHEMAS
// ============================================

export const updateCompanySettingsSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  legalForm: z.string().max(50).optional().or(z.literal('')),
  shareCapital: z.string().max(50).optional().or(z.literal('')),
  siret: z.string().max(20).optional().or(z.literal('')),
  siren: z.string().max(15).optional().or(z.literal('')),
  rcsNumber: z.string().max(50).optional().or(z.literal('')),
  rcsCity: z.string().max(100).optional().or(z.literal('')),
  tvaIntracom: z.string().max(20).optional().or(z.literal('')),
  apeCode: z.string().max(10).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  iban: z.string().max(34).optional().or(z.literal('')),
  bic: z.string().max(11).optional().or(z.literal('')),
  latePenaltyRate: z.coerce.number().min(0).max(100).optional(),
  earlyPaymentDiscount: z.string().max(500).optional().or(z.literal('')),
  legalFooter: z.string().max(2000).optional().or(z.literal('')),
  defaultTaxRate: z.coerce.number().min(0).max(100).optional(),
  defaultPaymentTerms: z.coerce.number().min(1).max(365).optional(),
  quotePrefix: z.string().min(1).max(10).optional(),
  invoicePrefix: z.string().min(1).max(10).optional(),
  creditNotePrefix: z.string().min(1).max(10).optional(),
  poPrefix: z.string().min(1).max(10).optional(),
  paymentPrefix: z.string().min(1).max(10).optional(),
  currency: z.string().length(3).optional(),
  locale: z.string().max(10).optional(),
  acAccountId: z.string().max(20).optional().or(z.literal('')),
  acApiToken: z.string().max(500).optional().or(z.literal('')),
  acSyncEnabled: z.boolean().optional(),
})
