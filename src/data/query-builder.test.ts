import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { parseExplorerQuery } from './filters'
import type { ExplorerFilters } from './filters'
import { countQuery, intentByPlatformQuery, rowsQuery } from './queries'
import { orderByClause, pageOffset, whereClause } from './query-builder'
import * as schema from './schema'

const dialect = new PgDialect()
const db = drizzle({ client: neon('postgresql://user:password@localhost/explorer'), schema })

function compile(fragment: SQL | undefined) {
  if (!fragment) return null
  return dialect.sqlToQuery(fragment)
}

function where(filters: ExplorerFilters) {
  return compile(whereClause(filters))
}

describe('whereClause', () => {
  it('adds no condition without filters', () => {
    expect(whereClause({})).toBeUndefined()
  })

  it.each([
    [{ show: 7 }, '"responses"."show_id" = $1', [7]],
    [{ platform: 'tidewell' }, '"responses"."platform" = $1', ['tidewell']],
    [{ region: 'midwest' }, '"responses"."region" = $1', ['midwest']],
    [{ ageGroup: '55+' }, '"responses"."age_group" = $1', ['55+']],
    [{ waveFrom: '2026-03' }, '"responses"."wave" >= $1', ['2026-03-01']],
    [{ waveTo: '2026-08' }, '"responses"."wave" <= $1', ['2026-08-01']],
    [{ minAwareness: 60 }, '"responses"."awareness" >= $1', [60]],
  ] as const)('filters %j in SQL with a bound parameter', (filters, sql, params) => {
    const query = where(filters)
    expect(query?.sql).toBe(sql)
    expect(query?.params).toEqual(params)
  })

  it('keeps a minimum awareness of 0 rather than treating it as missing', () => {
    expect(where({ minAwareness: 0 })?.params).toEqual([0])
  })

  it('filters genre through the shows table without joining it', () => {
    const query = where({ genre: 'crime' })
    expect(query?.sql).toBe(
      '"responses"."show_id" in (select "shows"."id" from "shows" where "shows"."genre" = $1)',
    )
    expect(query?.params).toEqual(['crime'])
  })

  it('combines every filter with AND, each value as a parameter', () => {
    const query = where({
      show: 3,
      genre: 'drama',
      platform: 'lumen-plus',
      region: 'south',
      ageGroup: '25-34',
      waveFrom: '2026-01',
      waveTo: '2026-06',
      minAwareness: 25,
    })
    expect(query?.sql.match(/ and /g)).toHaveLength(7)
    expect(query?.sql).not.toMatch(/ or /i)
    expect(query?.params).toEqual([
      3,
      'drama',
      'lumen-plus',
      'south',
      '25-34',
      '2026-01-01',
      '2026-06-01',
      25,
    ])
  })

  it('never puts filter values into the SQL text', () => {
    const query = where({ platform: 'tidewell', waveFrom: '2026-02', minAwareness: 70 })
    expect(query?.sql).not.toMatch(/tidewell|2026|70/)
  })
})

describe('orderByClause', () => {
  const order = (...args: Parameters<typeof orderByClause>) =>
    orderByClause(...args).map((part) => compile(part)?.sql)

  it.each([
    ['wave', '"responses"."wave"'],
    ['awareness', '"responses"."awareness"'],
    ['intent', '"responses"."intent"'],
    ['satisfaction', '"responses"."satisfaction"'],
    ['show', '"shows"."title"'],
  ] as const)('sorts by %s and breaks ties by id in the same direction', (sort, column) => {
    expect(order(sort, 'desc')).toEqual([`${column} desc`, '"responses"."id" desc'])
    expect(order(sort, 'asc')).toEqual([`${column} asc`, '"responses"."id" asc'])
  })
})

describe('pageOffset', () => {
  it.each([
    [1, 25, 0],
    [2, 25, 25],
    [3, 100, 200],
    [2000, 25, 49975],
  ] as const)('page %i of %i rows starts at row %i', (page, pageSize, offset) => {
    expect(pageOffset({ page, pageSize })).toBe(offset)
  })
})

describe('explorer queries', () => {
  it('pages rows in Postgres with LIMIT and OFFSET', () => {
    const { sql, params } = rowsQuery(
      db,
      parseExplorerQuery({ region: 'west', sort: 'intent', dir: 'asc', page: 3, pageSize: 50 }),
    ).toSQL()
    expect(sql).toContain('inner join "shows" on "shows"."id" = "responses"."show_id"')
    expect(sql).toContain('where "responses"."region" = $1')
    expect(sql).toContain('order by "responses"."intent" asc, "responses"."id" asc')
    expect(sql).toMatch(/limit \$2 offset \$3$/)
    expect(params).toEqual(['west', 50, 100])
  })

  it('counts and aggregates with the same filters as the rows', () => {
    const filters = { platform: 'quaystream', minAwareness: 30 } as const
    const rowsWhere = rowsQuery(db, parseExplorerQuery(filters)).toSQL()
    for (const query of [countQuery(db, filters), intentByPlatformQuery(db, filters)]) {
      const { sql, params } = query.toSQL()
      expect(sql).toContain('where ("responses"."platform" = $1 and "responses"."awareness" >= $2)')
      expect(params).toEqual(['quaystream', 30])
      expect(sql).not.toMatch(/limit|offset|order by/)
    }
    expect(rowsWhere.sql).toContain(
      'where ("responses"."platform" = $1 and "responses"."awareness" >= $2)',
    )
  })

  it('groups chart data in Postgres', () => {
    const { sql } = intentByPlatformQuery(db, {}).toSQL()
    expect(sql).toContain('avg("intent")')
    expect(sql).toContain('group by "responses"."platform"')
  })
})
