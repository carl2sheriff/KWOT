// Re-export Prisma generated types
export type {
  User,
  Client,
  Contact,
  Project,
  Task,
  Note,
  ProductCategory,
  Product,
  ProjectProduct,
  Supplier,
  Quote,
  QuoteItem,
  QuoteVersion,
  Invoice,
  InvoiceItem,
  CreditNote,
  CreditNoteItem,
  Payment,
  PaymentSchedule,
  PurchaseOrder,
  PurchaseOrderItem,
  AuditLog,
  CompanySettings,
} from '@prisma/client'

export type {
  QuoteStatus,
  InvoiceStatus,
  CreditNoteStatus,
  PaymentMethod,
  PaymentStatus,
  POStatus,
  AuditAction,
  DiscountType,
} from '@prisma/client'

// ============================================
// API Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: unknown
  pagination?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================
// Quote with Relations
// ============================================

export interface QuoteWithRelations {
  id: string
  reference: string
  version: number
  status: string
  validUntil: Date | null
  subtotal: string | number
  taxRate: string | number
  taxAmount: string | number
  discount: string | number
  discountType: string
  total: string | number
  notes: string | null
  terms: string | null
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    name: string
    company: string | null
    email: string | null
  }
  project?: {
    id: string
    name: string
  } | null
  createdBy: {
    id: string
    name: string
  }
  items: QuoteItemData[]
}

export interface QuoteItemData {
  id?: string
  productId?: string | null
  description: string
  quantity: number | string
  unitPrice: number | string
  discount: number | string
  taxRate: number | string
  total: number | string
  position: number
  section?: string
  product?: {
    id: string
    name: string
    sku: string
  } | null
}

// ============================================
// Invoice with Relations
// ============================================

export interface InvoiceWithRelations {
  id: string
  reference: string
  status: string
  situationNumber: number | null
  issueDate: Date
  dueDate: Date
  subtotal: string | number
  taxRate: string | number
  taxAmount: string | number
  discount: string | number
  total: string | number
  amountPaid: string | number
  amountDue: string | number
  notes: string | null
  terms: string | null
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    name: string
    company: string | null
    email: string | null
  }
  project?: {
    id: string
    name: string
  } | null
  createdBy: {
    id: string
    name: string
  }
  quote?: {
    id: string
    reference: string
  } | null
  items: InvoiceItemData[]
  payments: PaymentData[]
  creditNotes?: CreditNoteData[]
}

export interface InvoiceItemData {
  id?: string
  productId?: string | null
  description: string
  quantity: number | string
  unitPrice: number | string
  discount: number | string
  taxRate: number | string
  total: number | string
  position: number
  section?: string
}

// ============================================
// Credit Note with Relations
// ============================================

export interface CreditNoteWithRelations {
  id: string
  reference: string
  status: string
  issueDate: Date
  subtotal: string | number
  taxAmount: string | number
  total: string | number
  reason: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  invoice: {
    id: string
    reference: string
  }
  client: {
    id: string
    name: string
    company: string | null
    email: string | null
  }
  createdBy: {
    id: string
    name: string
  }
  items: CreditNoteItemData[]
}

export interface CreditNoteItemData {
  id?: string
  productId?: string | null
  description: string
  quantity: number | string
  unitPrice: number | string
  taxRate: number | string
  total: number | string
  position: number
}

export interface CreditNoteData {
  id: string
  reference: string
  status: string
  total: string | number
  issueDate: Date
  reason: string | null
}

// ============================================
// Payment with Relations
// ============================================

export interface PaymentData {
  id: string
  reference: string
  amount: string | number
  method: string
  status: string
  paidAt: Date | null
  notes: string | null
  isDeposit: boolean
  createdAt: Date
  invoice?: {
    id: string
    reference: string
    client: {
      id: string
      name: string
    }
  }
  receivedBy?: {
    id: string
    name: string
  }
}

// ============================================
// Dashboard Stats
// ============================================

export interface FinancialStats {
  revenueMTD: number
  revenueYTD: number
  outstandingInvoices: number
  outstandingAmount: number
  overdueAmount: number
  overdueCount: number
  pendingQuotes: number
  pendingQuotesAmount: number
  conversionRate: number
}

// ============================================
// Filter Types
// ============================================

export interface QuoteFilters {
  status?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface InvoiceFilters {
  status?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  overdue?: boolean
}

// ============================================
// Tax Breakdown
// ============================================

export interface TaxBreakdownEntry {
  rate: number
  base: number
  amount: number
}
