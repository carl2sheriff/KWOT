import { describe, it, expect } from 'vitest'
import { formatCurrency, calculateItemTotal, calculateTotals } from './numbering'

// ============================================
// formatCurrency
// ============================================

describe('formatCurrency', () => {
  it('formats EUR amount in French locale', () => {
    const result = formatCurrency(1234.56)
    // Intl may use narrow no-break space; normalize whitespace for assertion
    expect(result.replace(/\s/g, ' ')).toContain('1 234,56')
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
  })

  it('accepts string input', () => {
    const result = formatCurrency('99.99')
    expect(result).toContain('99,99')
  })

  it('rounds to 2 decimals', () => {
    const result = formatCurrency(10.999)
    expect(result).toContain('11,00')
  })

  it('supports custom currency', () => {
    const result = formatCurrency(100, 'USD', 'en-US')
    expect(result).toContain('$')
  })
})

// ============================================
// calculateItemTotal
// ============================================

describe('calculateItemTotal', () => {
  it('calculates simple quantity * price', () => {
    expect(calculateItemTotal(2, 100)).toBe(200)
  })

  it('applies discount', () => {
    expect(calculateItemTotal(2, 100, 50)).toBe(150)
  })

  it('handles zero quantity', () => {
    expect(calculateItemTotal(0, 100)).toBe(0)
  })

  it('handles zero price', () => {
    expect(calculateItemTotal(5, 0)).toBe(0)
  })

  it('handles decimal quantities', () => {
    expect(calculateItemTotal(1.5, 100)).toBe(150)
  })

  it('rounds to 2 decimal places', () => {
    // 3 * 33.33 = 99.99
    expect(calculateItemTotal(3, 33.33)).toBe(99.99)
  })

  it('handles large discount equal to subtotal', () => {
    expect(calculateItemTotal(1, 100, 100)).toBe(0)
  })
})

// ============================================
// calculateTotals
// ============================================

describe('calculateTotals', () => {
  it('calculates basic totals with default 20% tax', () => {
    const items = [
      { quantity: 1, unitPrice: 100 },
      { quantity: 2, unitPrice: 50 },
    ]
    const result = calculateTotals(items)

    expect(result.subtotal).toBe(200)
    expect(result.discountAmount).toBe(0)
    expect(result.taxAmount).toBe(40) // 200 * 20%
    expect(result.total).toBe(240)
  })

  it('applies percentage global discount', () => {
    const items = [{ quantity: 1, unitPrice: 1000 }]
    const result = calculateTotals(items, 20, 10, 'PERCENTAGE')

    expect(result.subtotal).toBe(1000)
    expect(result.discountAmount).toBe(100) // 10% of 1000
    expect(result.taxAmount).toBe(180) // 900 * 20%
    expect(result.total).toBe(1080) // 900 + 180
  })

  it('applies fixed global discount', () => {
    const items = [{ quantity: 1, unitPrice: 1000 }]
    const result = calculateTotals(items, 20, 200, 'FIXED')

    expect(result.subtotal).toBe(1000)
    expect(result.discountAmount).toBe(200)
    expect(result.taxAmount).toBe(160) // 800 * 20%
    expect(result.total).toBe(960) // 800 + 160
  })

  it('handles multi-TVA with per-item rates', () => {
    const items = [
      { quantity: 1, unitPrice: 100, taxRate: 20 },
      { quantity: 1, unitPrice: 100, taxRate: 5.5 },
    ]
    const result = calculateTotals(items)

    expect(result.subtotal).toBe(200)
    expect(result.taxBreakdown).toHaveLength(2)

    const rate5_5 = result.taxBreakdown.find((t) => t.rate === 5.5)
    const rate20 = result.taxBreakdown.find((t) => t.rate === 20)

    expect(rate5_5?.base).toBe(100)
    expect(rate5_5?.amount).toBe(5.5)
    expect(rate20?.base).toBe(100)
    expect(rate20?.amount).toBe(20)

    expect(result.taxAmount).toBe(25.5)
    expect(result.total).toBe(225.5)
  })

  it('uses defaultTaxRate when item has no taxRate', () => {
    const items = [{ quantity: 1, unitPrice: 100 }]
    const result = calculateTotals(items, 10)

    expect(result.taxBreakdown).toHaveLength(1)
    expect(result.taxBreakdown[0].rate).toBe(10)
    expect(result.taxAmount).toBe(10)
    expect(result.total).toBe(110)
  })

  it('handles zero tax rate', () => {
    const items = [{ quantity: 1, unitPrice: 100 }]
    const result = calculateTotals(items, 0)

    expect(result.taxAmount).toBe(0)
    expect(result.total).toBe(100)
  })

  it('handles item-level discounts', () => {
    const items = [{ quantity: 1, unitPrice: 100, discount: 20 }]
    const result = calculateTotals(items, 20)

    expect(result.subtotal).toBe(80) // 100 - 20 discount
    expect(result.taxAmount).toBe(16) // 80 * 20%
    expect(result.total).toBe(96)
  })

  it('handles empty items array', () => {
    const result = calculateTotals([])

    expect(result.subtotal).toBe(0)
    expect(result.taxAmount).toBe(0)
    expect(result.total).toBe(0)
    expect(result.discountAmount).toBe(0)
    expect(result.taxBreakdown).toHaveLength(0)
  })

  it('sorts tax breakdown by rate ascending', () => {
    const items = [
      { quantity: 1, unitPrice: 100, taxRate: 20 },
      { quantity: 1, unitPrice: 100, taxRate: 5.5 },
      { quantity: 1, unitPrice: 100, taxRate: 10 },
    ]
    const result = calculateTotals(items)

    expect(result.taxBreakdown[0].rate).toBe(5.5)
    expect(result.taxBreakdown[1].rate).toBe(10)
    expect(result.taxBreakdown[2].rate).toBe(20)
  })

  it('combines items with same tax rate in breakdown', () => {
    const items = [
      { quantity: 1, unitPrice: 100, taxRate: 20 },
      { quantity: 2, unitPrice: 50, taxRate: 20 },
    ]
    const result = calculateTotals(items)

    expect(result.taxBreakdown).toHaveLength(1)
    expect(result.taxBreakdown[0].base).toBe(200)
    expect(result.taxBreakdown[0].amount).toBe(40)
  })
})
