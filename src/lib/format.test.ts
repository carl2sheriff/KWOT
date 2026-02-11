import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatPercent,
  truncate,
  capitalize,
  STATUS_LABELS,
  getStatusVariant,
  generateLegalMentions,
} from './format'

// ============================================
// formatDate
// ============================================

describe('formatDate', () => {
  it('formats a Date object', () => {
    const date = new Date(2026, 0, 15) // Jan 15, 2026
    expect(formatDate(date)).toBe('15/01/2026')
  })

  it('formats a date string', () => {
    expect(formatDate('2026-06-01')).toMatch(/01\/06\/2026/)
  })
})

// ============================================
// formatDateTime
// ============================================

describe('formatDateTime', () => {
  it('includes time in output', () => {
    const date = new Date(2026, 5, 15, 14, 30) // Jun 15, 2026 14:30
    const result = formatDateTime(date)
    expect(result).toContain('15/06/2026')
    expect(result).toContain('14:30')
  })
})

// ============================================
// formatPercent
// ============================================

describe('formatPercent', () => {
  it('formats with one decimal', () => {
    expect(formatPercent(20)).toBe('20.0%')
  })

  it('formats fractional percentages', () => {
    expect(formatPercent(5.55)).toBe('5.5%')
  })

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })
})

// ============================================
// truncate
// ============================================

describe('truncate', () => {
  it('returns short text as-is', () => {
    expect(truncate('hello')).toBe('hello')
  })

  it('truncates long text with ellipsis', () => {
    const long = 'a'.repeat(60)
    const result = truncate(long, 50)
    expect(result).toHaveLength(53) // 50 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('handles exact length', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })
})

// ============================================
// capitalize
// ============================================

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('lowercases remaining letters', () => {
    expect(capitalize('HELLO')).toBe('Hello')
  })

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A')
  })

  it('handles empty string', () => {
    expect(capitalize('')).toBe('')
  })
})

// ============================================
// STATUS_LABELS
// ============================================

describe('STATUS_LABELS', () => {
  it('maps DRAFT to BROUILLON', () => {
    expect(STATUS_LABELS['DRAFT']).toBe('BROUILLON')
  })

  it('maps PAID to PAYE', () => {
    expect(STATUS_LABELS['PAID']).toBe('PAYE')
  })

  it('maps OVERDUE to EN RETARD', () => {
    expect(STATUS_LABELS['OVERDUE']).toBe('EN RETARD')
  })

  it('has all expected statuses', () => {
    const expected = [
      'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED',
      'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CREDITED',
      'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED',
      'APPLIED', 'CONFIRMED', 'RECEIVED',
      'active', 'inactive', 'prospect',
    ]
    for (const status of expected) {
      expect(STATUS_LABELS[status]).toBeDefined()
    }
  })
})

// ============================================
// getStatusVariant
// ============================================

describe('getStatusVariant', () => {
  it('returns success for APPROVED', () => {
    expect(getStatusVariant('APPROVED')).toBe('success')
  })

  it('returns success for PAID', () => {
    expect(getStatusVariant('PAID')).toBe('success')
  })

  it('returns warning for SENT', () => {
    expect(getStatusVariant('SENT')).toBe('warning')
  })

  it('returns warning for PARTIALLY_PAID', () => {
    expect(getStatusVariant('PARTIALLY_PAID')).toBe('warning')
  })

  it('returns danger for OVERDUE', () => {
    expect(getStatusVariant('OVERDUE')).toBe('danger')
  })

  it('returns danger for REJECTED', () => {
    expect(getStatusVariant('REJECTED')).toBe('danger')
  })

  it('returns muted for DRAFT', () => {
    expect(getStatusVariant('DRAFT')).toBe('muted')
  })

  it('returns default for unknown status', () => {
    expect(getStatusVariant('UNKNOWN_STATUS')).toBe('default')
  })
})

// ============================================
// generateLegalMentions
// ============================================

describe('generateLegalMentions', () => {
  it('generates default mentions with penalty rate', () => {
    const mentions = generateLegalMentions({})

    expect(mentions.length).toBeGreaterThanOrEqual(2)
    // Default 12% penalty rate
    expect(mentions.some((m) => m.includes('12%'))).toBe(true)
    // Mandatory 40€ recovery fee
    expect(mentions.some((m) => m.includes('40 euros'))).toBe(true)
    // No early discount by default
    expect(mentions.some((m) => m.includes("Pas d'escompte"))).toBe(true)
  })

  it('includes payment terms when provided', () => {
    const mentions = generateLegalMentions({ defaultPaymentTerms: 30 })
    expect(mentions.some((m) => m.includes('30 jours'))).toBe(true)
  })

  it('uses custom penalty rate', () => {
    const mentions = generateLegalMentions({ latePenaltyRate: 15 })
    expect(mentions.some((m) => m.includes('15%'))).toBe(true)
  })

  it('includes early payment discount when provided', () => {
    const mentions = generateLegalMentions({ earlyPaymentDiscount: '2% si paiement sous 10 jours' })
    expect(mentions.some((m) => m.includes('2% si paiement sous 10 jours'))).toBe(true)
    // Should NOT have "Pas d'escompte" when discount is set
    expect(mentions.some((m) => m.includes("Pas d'escompte"))).toBe(false)
  })
})
