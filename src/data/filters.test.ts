import { describe, expect, it } from 'vitest'

import {
  EXPLORER_DEFAULTS,
  explorerFiltersSchema,
  explorerQuerySchema,
  parseExplorerFilters,
  parseExplorerQuery,
} from './filters'

const FILTERS = {
  show: 3,
  genre: 'crime',
  platform: 'lumen-plus',
  region: 'west',
  ageGroup: '55+',
  waveFrom: '2026-01',
  waveTo: '2026-06',
  minAwareness: 40,
}

const FULL = { ...FILTERS, sort: 'intent', dir: 'asc', page: 4, pageSize: 50 }

describe('explorerQuerySchema', () => {
  it('fills defaults for an empty or missing input', () => {
    expect(parseExplorerQuery({})).toEqual(EXPLORER_DEFAULTS)
    expect(parseExplorerQuery(undefined)).toEqual(EXPLORER_DEFAULTS)
  })

  it('accepts every field at once', () => {
    expect(parseExplorerQuery(FULL)).toEqual(FULL)
  })

  it.each([
    ['show', 0],
    ['show', -2],
    ['show', 1.5],
    ['show', '3'],
    ['genre', 'western'],
    ['platform', 'netflix'],
    ['platform', 'Lumen+'],
    ['region', 'north'],
    ['ageGroup', '18-25'],
    ['waveFrom', '2026-13'],
    ['waveFrom', '2026-1'],
    ['waveTo', '2026-06-01'],
    ['minAwareness', -1],
    ['minAwareness', 101],
    ['minAwareness', 50.5],
    ['sort', 'id'],
    ['sort', 'gender'],
    ['dir', 'up'],
    ['page', 0],
    ['page', 2001],
    ['pageSize', 30],
    ['pageSize', '25'],
  ])('rejects %s = %j', (key, value) => {
    expect(explorerQuerySchema.safeParse({ [key]: value }).success).toBe(false)
  })

  it('rejects unknown fields instead of ignoring them', () => {
    expect(explorerQuerySchema.safeParse({ limit: 5000 }).success).toBe(false)
    expect(explorerQuerySchema.safeParse({ orderBy: 'id; drop table responses' }).success).toBe(false)
  })

  it('rejects a wave range that ends before it starts', () => {
    const result = explorerQuerySchema.safeParse({ waveFrom: '2026-06', waveTo: '2026-01' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['waveTo'])
  })

  it('accepts a single-month wave range and open-ended ranges', () => {
    expect(parseExplorerQuery({ waveFrom: '2026-03', waveTo: '2026-03' }).waveTo).toBe('2026-03')
    expect(parseExplorerQuery({ waveFrom: '2026-03' }).waveTo).toBeUndefined()
    expect(parseExplorerQuery({ waveTo: '2026-03' }).waveFrom).toBeUndefined()
  })

  it('accepts the edges of each range', () => {
    expect(parseExplorerQuery({ minAwareness: 0 }).minAwareness).toBe(0)
    expect(parseExplorerQuery({ minAwareness: 100 }).minAwareness).toBe(100)
    expect(parseExplorerQuery({ page: 2000 }).page).toBe(2000)
  })

  it('throws on invalid input so the server function never queries', () => {
    expect(() => parseExplorerQuery({ platform: 'netflix' })).toThrow()
    expect(() => parseExplorerQuery('platform=netflix')).toThrow()
  })
})

describe('explorerFiltersSchema', () => {
  it('accepts filters only', () => {
    expect(parseExplorerFilters(FILTERS)).toEqual(FILTERS)
  })

  it('rejects sort and paging fields, which charts do not use', () => {
    expect(explorerFiltersSchema.safeParse({ sort: 'intent' }).success).toBe(false)
    expect(explorerFiltersSchema.safeParse({ page: 2 }).success).toBe(false)
  })

  it('applies the same wave range rule', () => {
    expect(
      explorerFiltersSchema.safeParse({ waveFrom: '2026-09', waveTo: '2026-02' }).success,
    ).toBe(false)
  })
})
