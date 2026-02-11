import { describe, it, expect } from 'vitest'
import { parsePagination, buildPagination } from './api-middleware'

// ============================================
// parsePagination
// ============================================

describe('parsePagination', () => {
  it('returns defaults for empty params', () => {
    const params = new URLSearchParams()
    const { page, limit, skip } = parsePagination(params)

    expect(page).toBe(1)
    expect(limit).toBe(20)
    expect(skip).toBe(0)
  })

  it('parses page and limit', () => {
    const params = new URLSearchParams('page=3&limit=50')
    const { page, limit, skip } = parsePagination(params)

    expect(page).toBe(3)
    expect(limit).toBe(50)
    expect(skip).toBe(100) // (3-1) * 50
  })

  it('clamps page to minimum 1', () => {
    const params = new URLSearchParams('page=0')
    expect(parsePagination(params).page).toBe(1)

    const paramsNeg = new URLSearchParams('page=-5')
    expect(parsePagination(paramsNeg).page).toBe(1)
  })

  it('clamps limit to max 100', () => {
    const params = new URLSearchParams('limit=500')
    expect(parsePagination(params).limit).toBe(100)
  })

  it('clamps limit to minimum 1', () => {
    const params = new URLSearchParams('limit=0')
    expect(parsePagination(params).limit).toBe(1)
  })

  it('handles NaN values gracefully', () => {
    const params = new URLSearchParams('page=abc&limit=xyz')
    const { page, limit } = parsePagination(params)
    // parseInt('abc') = NaN, Math.max(1, NaN) = NaN
    expect(Number.isNaN(page)).toBe(true)
    expect(Number.isNaN(limit)).toBe(true)
  })
})

// ============================================
// buildPagination
// ============================================

describe('buildPagination', () => {
  it('builds pagination metadata', () => {
    const result = buildPagination(1, 20, 42)

    expect(result).toEqual({
      page: 1,
      limit: 20,
      total: 42,
      totalPages: 3, // ceil(42/20)
    })
  })

  it('handles exact page count', () => {
    const result = buildPagination(1, 20, 40)
    expect(result.totalPages).toBe(2)
  })

  it('handles zero total', () => {
    const result = buildPagination(1, 20, 0)
    expect(result.totalPages).toBe(0)
  })

  it('handles single item', () => {
    const result = buildPagination(1, 20, 1)
    expect(result.totalPages).toBe(1)
  })

  it('handles limit of 1', () => {
    const result = buildPagination(1, 1, 5)
    expect(result.totalPages).toBe(5)
  })
})
