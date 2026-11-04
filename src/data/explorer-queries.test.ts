import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { explorerQueries, loadExplorer } from './explorer-queries'
import type { ExplorerCharts, ExplorerOptions, ResponsePage } from './types'

// Every test seeds the cache, so a call to the database means a key mismatch.
vi.mock('./functions', () => {
  const unexpected = () => Promise.reject(new Error('fetched instead of using the cache'))
  return { getExplorerRows: unexpected, getExplorerCharts: unexpected, getExplorerOptions: unexpected }
})

const options: ExplorerOptions = { shows: [], waves: ['2026-09', '2026-10'] }
const charts: ExplorerCharts = { intentByPlatform: [], awarenessByAgeGroup: [] }
const rows = (page: number, totalPages: number): ResponsePage => ({
  rows: [],
  total: totalPages * 25,
  page,
  pageSize: 25,
  totalPages,
})

function seeded(search: Parameters<typeof explorerQueries>[0], totalPages: number) {
  const client = new QueryClient()
  const queries = explorerQueries(search)
  client.setQueryData(queries.options.queryKey, options)
  client.setQueryData(queries.rows.queryKey, rows(queries.query.page, totalPages))
  client.setQueryData(queries.charts.queryKey, charts)
  return client
}

describe('explorerQueries', () => {
  it('gives equivalent URLs the same keys, so server data is reused after hydration', () => {
    const short = explorerQueries({ platform: 'tidewell' })
    const explicit = explorerQueries({ platform: 'tidewell', sort: 'wave', dir: 'desc', page: 1, pageSize: 25 })
    expect(explicit.rows.queryKey).toEqual(short.rows.queryKey)
    expect(explicit.charts.queryKey).toEqual(short.charts.queryKey)
  })

  it('keys the charts by filters only, so sorting and paging reuse them', () => {
    const first = explorerQueries({ platform: 'tidewell' })
    const sorted = explorerQueries({ platform: 'tidewell', sort: 'intent', page: 3 })
    expect(sorted.charts.queryKey).toEqual(first.charts.queryKey)
    expect(sorted.rows.queryKey).not.toEqual(first.rows.queryKey)
  })
})

describe('loadExplorer', () => {
  it('loads every query on the first visit', async () => {
    await expect(loadExplorer(seeded({ page: 2 }, 3), { page: 2 }, 'enter')).resolves.toBeUndefined()
  })

  it('is a 404 past the last page', async () => {
    await expect(loadExplorer(seeded({ page: 4 }, 3), { page: 4 }, 'enter')).rejects.toMatchObject({
      isNotFound: true,
    })
  })

  it('only prefetches when the search changes on the page', async () => {
    const client = new QueryClient()
    const prefetch = vi.spyOn(client, 'prefetchQuery').mockResolvedValue()
    const ensure = vi.spyOn(client, 'ensureQueryData')
    await loadExplorer(client, { page: 99 }, 'stay')
    expect(prefetch).toHaveBeenCalledTimes(2)
    expect(ensure).not.toHaveBeenCalled()
  })
})
