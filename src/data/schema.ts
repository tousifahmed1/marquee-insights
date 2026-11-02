import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
} from 'drizzle-orm/pg-core'

import { AGE_GROUPS, GENDERS, GENRES, PLATFORMS, REGIONS, values } from './dimensions'

export const platformEnum = pgEnum('platform', values(PLATFORMS))
export const genreEnum = pgEnum('genre', values(GENRES))
export const regionEnum = pgEnum('region', values(REGIONS))
export const ageGroupEnum = pgEnum('age_group', values(AGE_GROUPS))
export const genderEnum = pgEnum('gender', values(GENDERS))

export const shows = pgTable(
  'shows',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: text().notNull().unique(),
    genre: genreEnum().notNull(),
    platform: platformEnum().notNull(),
    releaseYear: smallint('release_year').notNull(),
  },
  (t) => [
    index('shows_genre_idx').on(t.genre),
    index('shows_platform_idx').on(t.platform),
    check('shows_release_year_range', sql`${t.releaseYear} between 1950 and 2100`),
  ],
)

export const responses = pgTable(
  'responses',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    showId: integer('show_id')
      .notNull()
      .references(() => shows.id, { onDelete: 'cascade' }),
    platform: platformEnum().notNull(),
    region: regionEnum().notNull(),
    ageGroup: ageGroupEnum('age_group').notNull(),
    gender: genderEnum().notNull(),
    wave: date({ mode: 'string' }).notNull(),
    awareness: smallint().notNull(),
    intent: smallint().notNull(),
    satisfaction: smallint().notNull(),
    wouldRecommend: boolean('would_recommend').notNull(),
  },
  (t) => [
    index('responses_age_group_idx').on(t.ageGroup),
    index('responses_wave_id_idx').on(t.wave, t.id),
    index('responses_awareness_idx').on(t.awareness),
    index('responses_intent_idx').on(t.intent),
    index('responses_satisfaction_idx').on(t.satisfaction),
    index('responses_show_wave_idx').on(t.showId, t.wave),
    index('responses_platform_wave_idx').on(t.platform, t.wave),
    index('responses_region_age_group_idx').on(t.region, t.ageGroup),
    check('responses_wave_first_of_month', sql`extract(day from ${t.wave}) = 1`),
    check('responses_awareness_range', sql`${t.awareness} between 0 and 100`),
    check('responses_intent_range', sql`${t.intent} between 0 and 100`),
    check('responses_satisfaction_range', sql`${t.satisfaction} between 1 and 10`),
  ],
)

export type Show = typeof shows.$inferSelect
export type NewShow = typeof shows.$inferInsert
export type Response = typeof responses.$inferSelect
export type NewResponse = typeof responses.$inferInsert
