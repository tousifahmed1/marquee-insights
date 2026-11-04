import { describe, expect, it } from 'vitest'

import { EXPLORER_DEFAULTS } from './filters'
import {
  activeFilterCount,
  cleanSearch,
  toExplorerQuery,
  toFilters,
  withFilters,
  withPage,
  withPageSize,
  withSort,
  withoutFilters,
} from './search'

describe('cleanSearch', () => {
  it('keeps valid values', () => {
    expect(cleanSearch({ platform: 'tidewell', region: 'south', sort: 'intent', page: 3 })).toEqual({
      platform: 'tidewell',
      region: 'south',
      sort: 'intent',
      page: 3,
    })
  })

  it('drops invalid values one by one instead of failing the whole URL', () => {
    expect(
      cleanSearch({ platform: 'netflix', region: 'west', page: -3, sort: 'evil', minAwareness: 140 }),
    ).toEqual({ region: 'west' })
  })

  it('drops unknown keys, empty values and nulls', () => {
    expect(cleanSearch({ utm_source: 'mail', genre: '', show: null, region: undefined })).toEqual({})
  })

  it('leaves defaults out so URLs stay short', () => {
    expect(cleanSearch({ ...EXPLORER_DEFAULTS })).toEqual({})
    expect(cleanSearch({ sort: 'wave', dir: 'asc' })).toEqual({ dir: 'asc' })
  })

  it('reads numbers typed into the URL as strings', () => {
    expect(cleanSearch({ show: '12', minAwareness: '60', page: '2', pageSize: '100' })).toEqual({
      show: 12,
      minAwareness: 60,
      page: 2,
      pageSize: 100,
    })
    expect(cleanSearch({ show: '12abc', page: '1e3' })).toEqual({})
  })

  it('swaps a wave range that was entered backwards', () => {
    expect(cleanSearch({ waveFrom: '2026-08', waveTo: '2026-02' })).toEqual({
      waveFrom: '2026-02',
      waveTo: '2026-08',
    })
  })

  it('returns search that the strict server schema accepts', () => {
    const search = cleanSearch({
      platform: 'netflix',
      waveFrom: '2026-08',
      waveTo: '2026-02',
      page: '0',
      pageSize: 7,
      junk: true,
    })
    expect(() => toExplorerQuery(search)).not.toThrow()
  })
})

describe('withFilters', () => {
  it('sets a filter and goes back to the first page', () => {
    expect(withFilters({ page: 5, sort: 'intent' }, { platform: 'tidewell' })).toEqual({
      platform: 'tidewell',
      sort: 'intent',
    })
  })

  it('removes a filter set to undefined', () => {
    expect(withFilters({ platform: 'tidewell', region: 'west' }, { platform: undefined })).toEqual({
      region: 'west',
    })
  })

  it('ignores an invalid filter value', () => {
    expect(withFilters({ region: 'west' }, { genre: 'western' })).toEqual({ region: 'west' })
  })
})

describe('URL changes', () => {
  const view = { platform: 'tidewell', region: 'west', sort: 'intent', dir: 'asc', pageSize: 50, page: 4 } as const

  it('clears every filter but keeps the sort, direction and page size', () => {
    expect(withoutFilters(view)).toEqual({ sort: 'intent', dir: 'asc', pageSize: 50 })
  })

  it('goes back to the first page when the sort or page size changes', () => {
    expect(withSort(view, 'satisfaction', 'desc')).toEqual({
      platform: 'tidewell',
      region: 'west',
      sort: 'satisfaction',
      pageSize: 50,
    })
    expect(withPageSize(view, 100)).toEqual({
      platform: 'tidewell',
      region: 'west',
      sort: 'intent',
      dir: 'asc',
      pageSize: 100,
    })
  })

  it('leaves default values out of the URL', () => {
    expect(withSort({ sort: 'intent' }, 'wave', 'desc')).toEqual({})
    expect(withPageSize({ pageSize: 50 }, 25)).toEqual({})
    expect(withPage({ page: 3 }, 1)).toEqual({})
  })

  it('moves to a page and keeps everything else', () => {
    expect(withPage({ platform: 'tidewell' }, 2)).toEqual({ platform: 'tidewell', page: 2 })
  })
})

describe('toExplorerQuery and toFilters', () => {
  it('fills defaults for the server function', () => {
    expect(toExplorerQuery({ region: 'west' })).toEqual({ ...EXPLORER_DEFAULTS, region: 'west' })
  })

  it('keeps only filter fields for the charts', () => {
    expect(toFilters(toExplorerQuery({ region: 'west', sort: 'intent', page: 3 }))).toEqual({
      region: 'west',
    })
  })

  it('counts active filters, not sort or paging', () => {
    expect(activeFilterCount({ region: 'west', minAwareness: 0, sort: 'intent', page: 2 })).toBe(2)
    expect(activeFilterCount({})).toBe(0)
  })
})
