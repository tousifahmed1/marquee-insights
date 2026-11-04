import { describe, expect, it } from 'vitest'

import { parseReportsSearch, reportsPath, reportsSearch } from './reports-search'

describe('reports search', () => {
  it.each(['/reports', '/reports?category=film', '/reports?page=2', '/reports?category=tv&page=3'])(
    'reads %s back to the same URL',
    (path) => {
      const raw = Object.fromEntries(new URL(path, 'https://marquee.test').searchParams)
      expect(reportsPath(parseReportsSearch(raw))).toBe(path)
    },
  )

  it('drops invalid values and leaves the defaults out', () => {
    expect(parseReportsSearch({ category: 'opera', page: '1', sort: 'new' })).toEqual({})
    expect(parseReportsSearch({ category: 'film', page: 'abc' })).toEqual({ category: 'film' })
  })

  it('builds link searches without defaults', () => {
    expect(reportsSearch(null, 1)).toEqual({})
    expect(reportsSearch('gaming', 2)).toEqual({ category: 'gaming', page: 2 })
  })
})
