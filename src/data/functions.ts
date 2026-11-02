import { createServerFn } from '@tanstack/react-start'

import { getDb } from './db'
import { AGE_GROUPS, PLATFORMS, values } from './dimensions'
import { parseExplorerFilters, parseExplorerQuery } from './filters'
import {
  awarenessByAgeGroupQuery,
  countQuery,
  intentByPlatformQuery,
  rowsQuery,
  showOptionsQuery,
  waveBoundsQuery,
} from './queries'
import { fillGroups, monthsBetween, toResponsePage } from './results'
import { timed } from './timing'
import type { ExplorerCharts, ExplorerOptions, ResponsePage } from './types'

export const getExplorerRows = createServerFn({ method: 'GET' })
  .validator(parseExplorerQuery)
  .handler(async ({ data }): Promise<ResponsePage> => {
    const db = getDb()
    const [rows, [counted]] = await timed('explorer rows', () =>
      db.batch([rowsQuery(db, data), countQuery(db, data)]),
    )
    return toResponsePage(rows, counted?.total ?? 0, data)
  })

export const getExplorerCharts = createServerFn({ method: 'GET' })
  .validator(parseExplorerFilters)
  .handler(async ({ data }): Promise<ExplorerCharts> => {
    const db = getDb()
    const [platforms, ageGroups] = await timed('explorer charts', () =>
      db.batch([intentByPlatformQuery(db, data), awarenessByAgeGroupQuery(db, data)]),
    )
    return {
      intentByPlatform: fillGroups(values(PLATFORMS), platforms),
      awarenessByAgeGroup: fillGroups(values(AGE_GROUPS), ageGroups),
    }
  })

export const getExplorerOptions = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ExplorerOptions> => {
    const db = getDb()
    const [showOptions, [bounds]] = await timed('explorer options', () =>
      db.batch([showOptionsQuery(db), waveBoundsQuery(db)]),
    )
    return { shows: showOptions, waves: monthsBetween(bounds?.first ?? null, bounds?.last ?? null) }
  },
)
