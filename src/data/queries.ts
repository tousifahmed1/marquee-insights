import { avg, count, eq, max, min, sql } from 'drizzle-orm'

import type { Db } from './db'
import type { ExplorerFilters, ExplorerQuery } from './filters'
import { orderByClause, pageOffset, whereClause } from './query-builder'
import { responses, shows } from './schema'

export function rowsQuery(db: Db, query: ExplorerQuery) {
  return db
    .select({
      id: responses.id,
      showId: responses.showId,
      showTitle: shows.title,
      genre: shows.genre,
      platform: responses.platform,
      region: responses.region,
      ageGroup: responses.ageGroup,
      gender: responses.gender,
      wave: responses.wave,
      awareness: responses.awareness,
      intent: responses.intent,
      satisfaction: responses.satisfaction,
      wouldRecommend: responses.wouldRecommend,
    })
    .from(responses)
    .innerJoin(shows, eq(shows.id, responses.showId))
    .where(whereClause(query))
    .orderBy(...orderByClause(query.sort, query.dir))
    .limit(query.pageSize)
    .offset(pageOffset(query))
}

export function countQuery(db: Db, filters: ExplorerFilters) {
  return db.select({ total: count() }).from(responses).where(whereClause(filters))
}

export function intentByPlatformQuery(db: Db, filters: ExplorerFilters) {
  return db
    .select({
      key: responses.platform,
      average: avg(responses.intent).mapWith(Number),
      responses: count(),
    })
    .from(responses)
    .where(whereClause(filters))
    .groupBy(responses.platform)
}

export function awarenessByAgeGroupQuery(db: Db, filters: ExplorerFilters) {
  return db
    .select({
      key: responses.ageGroup,
      average: avg(responses.awareness).mapWith(Number),
      responses: count(),
    })
    .from(responses)
    .where(whereClause(filters))
    .groupBy(responses.ageGroup)
}

export function showOptionsQuery(db: Db) {
  return db
    .select({ id: shows.id, title: shows.title, genre: shows.genre, platform: shows.platform })
    .from(shows)
    .orderBy(sql`lower(${shows.title})`)
}

export function waveBoundsQuery(db: Db) {
  return db.select({ first: min(responses.wave), last: max(responses.wave) }).from(responses)
}
