import { prisma } from './db'

type DocumentType = 'quote' | 'invoice' | 'creditNote' | 'purchaseOrder' | 'payment'

const prefixMap: Record<DocumentType, { prefixField: string; numberField: string }> = {
  quote: { prefixField: 'quotePrefix', numberField: 'nextQuoteNumber' },
  invoice: { prefixField: 'invoicePrefix', numberField: 'nextInvoiceNumber' },
  creditNote: { prefixField: 'creditNotePrefix', numberField: 'nextCreditNoteNumber' },
  purchaseOrder: { prefixField: 'poPrefix', numberField: 'nextPONumber' },
  payment: { prefixField: 'paymentPrefix', numberField: 'nextPaymentNumber' },
}

/**
 * Generate next reference number atomically.
 * Format: PREFIX-YYYY-NNNN (e.g., DEV-2026-0001, FAC-2026-0042)
 */
export async function generateReference(type: DocumentType): Promise<string> {
  const { prefixField, numberField } = prefixMap[type]
  const year = new Date().getFullYear()

  // Atomic increment using transaction with row-level lock to prevent race conditions
  const settings = await prisma.$transaction(async (tx) => {
    // Acquire row-level lock with FOR UPDATE to prevent concurrent reads
    const rows = await tx.$queryRaw<{ id: string; counter_year: number }[]>`
      SELECT id, counter_year FROM company_settings LIMIT 1 FOR UPDATE
    `

    if (!rows || rows.length === 0) {
      // Create default settings if none exist
      return tx.companySettings.create({
        data: {
          [numberField]: 2,
          counterYear: year,
        },
      })
    }

    const current = rows[0]

    // Reset all counters when the year changes
    if (current.counter_year !== year) {
      await tx.companySettings.update({
        where: { id: current.id },
        data: {
          nextQuoteNumber: 1,
          nextInvoiceNumber: 1,
          nextCreditNoteNumber: 1,
          nextPONumber: 1,
          nextPaymentNumber: 1,
          counterYear: year,
        },
      })
    }

    return tx.companySettings.update({
      where: { id: current.id },
      data: {
        [numberField]: { increment: 1 },
      },
    })
  })

  const prefix = (settings as Record<string, unknown>)[prefixField] as string
  // The number we use is the PREVIOUS value (before increment)
  const number = ((settings as Record<string, unknown>)[numberField] as number) - 1
  const paddedNumber = String(number).padStart(4, '0')

  return `${prefix}-${year}-${paddedNumber}`
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Calculate line item total (HT)
 */
export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  discount: number = 0
): number {
  const subtotal = quantity * unitPrice
  return Math.round((subtotal - discount) * 100) / 100
}

/**
 * Calculate document totals with multi-TVA support.
 * Each item can have its own taxRate. The document taxRate is used as default.
 */
export function calculateTotals(
  items: { quantity: number; unitPrice: number; discount?: number; taxRate?: number }[],
  defaultTaxRate: number = 20,
  globalDiscount: number = 0,
  discountType: 'PERCENTAGE' | 'FIXED' = 'PERCENTAGE'
): { subtotal: number; taxAmount: number; total: number; discountAmount: number; taxBreakdown: TaxBreakdownEntry[] } {
  const subtotal = items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.quantity, item.unitPrice, item.discount || 0)
  }, 0)

  const discountAmount =
    discountType === 'PERCENTAGE'
      ? Math.round(subtotal * (globalDiscount / 100) * 100) / 100
      : globalDiscount

  const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0

  // Group items by tax rate and compute per-rate tax
  const rateGroups = new Map<number, number>()
  for (const item of items) {
    const rate = item.taxRate ?? defaultTaxRate
    const itemHT = calculateItemTotal(item.quantity, item.unitPrice, item.discount || 0)
    const adjustedHT = Math.round(itemHT * discountRatio * 100) / 100
    rateGroups.set(rate, (rateGroups.get(rate) || 0) + adjustedHT)
  }

  const taxBreakdown: TaxBreakdownEntry[] = []
  let taxAmount = 0
  for (const [rate, base] of rateGroups) {
    const tax = Math.round(base * (rate / 100) * 100) / 100
    taxAmount += tax
    taxBreakdown.push({ rate, base, amount: tax })
  }
  taxBreakdown.sort((a, b) => a.rate - b.rate)

  const afterDiscount = subtotal - discountAmount
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100

  return { subtotal, taxAmount, total, discountAmount, taxBreakdown }
}

export interface TaxBreakdownEntry {
  rate: number
  base: number
  amount: number
}
