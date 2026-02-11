import { describe, it, expect } from 'vitest'
import {
  createClientSchema,
  updateClientSchema,
  createQuoteSchema,
  createInvoiceSchema,
  createPaymentSchema,
  createCreditNoteSchema,
  createPurchaseOrderSchema,
  createSupplierSchema,
  updateCompanySettingsSchema,
  paginationSchema,
} from './schemas'

// ============================================
// paginationSchema
// ============================================

describe('paginationSchema', () => {
  it('applies defaults', () => {
    const result = paginationSchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('coerces string values', () => {
    const result = paginationSchema.parse({ page: '3', limit: '50' })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(50)
  })

  it('rejects page < 1', () => {
    const result = paginationSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects limit > 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })
})

// ============================================
// createClientSchema
// ============================================

describe('createClientSchema', () => {
  it('validates a minimal client', () => {
    const result = createClientSchema.safeParse({ name: 'ACME Corp' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('active') // default
    }
  })

  it('rejects empty name', () => {
    const result = createClientSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts all optional fields', () => {
    const result = createClientSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      phone: '0601020304',
      company: 'Test SAS',
      address: '1 rue de Paris',
      notes: 'VIP client',
      status: 'prospect',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = createClientSchema.safeParse({ name: 'Test', email: 'not-email' })
    expect(result.success).toBe(false)
  })

  it('allows empty string for optional fields', () => {
    const result = createClientSchema.safeParse({ name: 'Test', email: '', phone: '' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = createClientSchema.safeParse({ name: 'Test', status: 'vip' })
    expect(result.success).toBe(false)
  })
})

// ============================================
// updateClientSchema
// ============================================

describe('updateClientSchema', () => {
  it('allows partial updates', () => {
    const result = updateClientSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('allows empty object', () => {
    const result = updateClientSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

// ============================================
// createQuoteSchema
// ============================================

describe('createQuoteSchema', () => {
  const validQuote = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    items: [{ description: 'Service photo', quantity: 1, unitPrice: 500 }],
  }

  it('validates a minimal quote', () => {
    const result = createQuoteSchema.safeParse(validQuote)
    expect(result.success).toBe(true)
  })

  it('rejects missing clientId', () => {
    const result = createQuoteSchema.safeParse({ items: validQuote.items })
    expect(result.success).toBe(false)
  })

  it('rejects empty items', () => {
    const result = createQuoteSchema.safeParse({ clientId: validQuote.clientId, items: [] })
    expect(result.success).toBe(false)
  })

  it('rejects invalid clientId format', () => {
    const result = createQuoteSchema.safeParse({ ...validQuote, clientId: 'not-uuid' })
    expect(result.success).toBe(false)
  })

  it('accepts milestones', () => {
    const result = createQuoteSchema.safeParse({
      ...validQuote,
      milestones: [
        { label: 'Acompte', percentage: 30 },
        { label: 'Livraison', percentage: 70 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('applies default taxRate of 20', () => {
    const result = createQuoteSchema.safeParse(validQuote)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.taxRate).toBe(20)
    }
  })
})

// ============================================
// createInvoiceSchema
// ============================================

describe('createInvoiceSchema', () => {
  const validInvoice = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    dueDate: '2026-03-01',
    items: [{ description: 'Prestation video', quantity: 2, unitPrice: 1000 }],
  }

  it('validates a minimal invoice', () => {
    const result = createInvoiceSchema.safeParse(validInvoice)
    expect(result.success).toBe(true)
  })

  it('rejects missing dueDate', () => {
    const { dueDate, ...noDue } = validInvoice
    const result = createInvoiceSchema.safeParse(noDue)
    expect(result.success).toBe(false)
  })

  it('rejects missing items', () => {
    const { items, ...noItems } = validInvoice
    const result = createInvoiceSchema.safeParse(noItems)
    expect(result.success).toBe(false)
  })
})

// ============================================
// createPaymentSchema
// ============================================

describe('createPaymentSchema', () => {
  it('validates a payment', () => {
    const result = createPaymentSchema.safeParse({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 500,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.method).toBe('BANK_TRANSFER') // default
    }
  })

  it('rejects amount < 0.01', () => {
    const result = createPaymentSchema.safeParse({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 0,
    })
    expect(result.success).toBe(false)
  })

  it('accepts all payment methods', () => {
    for (const method of ['BANK_TRANSFER', 'CHECK', 'CARD', 'CASH', 'OTHER']) {
      const result = createPaymentSchema.safeParse({
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        method,
      })
      expect(result.success).toBe(true)
    }
  })
})

// ============================================
// createCreditNoteSchema
// ============================================

describe('createCreditNoteSchema', () => {
  it('validates a credit note', () => {
    const result = createCreditNoteSchema.safeParse({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      items: [{ description: 'Remboursement', quantity: 1, unitPrice: 200 }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing invoiceId', () => {
    const result = createCreditNoteSchema.safeParse({
      items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    })
    expect(result.success).toBe(false)
  })
})

// ============================================
// createPurchaseOrderSchema
// ============================================

describe('createPurchaseOrderSchema', () => {
  it('validates a purchase order', () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: '550e8400-e29b-41d4-a716-446655440000',
      items: [{ description: 'Camera rental', quantity: 1, unitPrice: 300 }],
    })
    expect(result.success).toBe(true)
  })
})

// ============================================
// createSupplierSchema
// ============================================

describe('createSupplierSchema', () => {
  it('validates a supplier', () => {
    const result = createSupplierSchema.safeParse({ name: 'Location Materiel SAS' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createSupplierSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

// ============================================
// updateCompanySettingsSchema
// ============================================

describe('updateCompanySettingsSchema', () => {
  it('accepts partial settings', () => {
    const result = updateCompanySettingsSchema.safeParse({
      companyName: 'Sheriff Projects',
      defaultTaxRate: 20,
    })
    expect(result.success).toBe(true)
  })

  it('validates currency is 3 chars', () => {
    expect(updateCompanySettingsSchema.safeParse({ currency: 'EU' }).success).toBe(false)
    expect(updateCompanySettingsSchema.safeParse({ currency: 'EUR' }).success).toBe(true)
    expect(updateCompanySettingsSchema.safeParse({ currency: 'EURO' }).success).toBe(false)
  })

  it('validates tax rate range', () => {
    expect(updateCompanySettingsSchema.safeParse({ defaultTaxRate: -1 }).success).toBe(false)
    expect(updateCompanySettingsSchema.safeParse({ defaultTaxRate: 101 }).success).toBe(false)
    expect(updateCompanySettingsSchema.safeParse({ defaultTaxRate: 20 }).success).toBe(true)
  })
})
