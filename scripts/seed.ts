import { existsSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

import { Pool } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-serverless'

import * as schema from '../src/data/schema'
import type { NewResponse } from '../src/data/schema'
import { responses, shows } from '../src/data/schema'

import { CATALOGUE } from '../src/data/catalogue'
import { generateResponses, lastWaves, profileShows } from './survey-data/generate'
import { createRandom } from './survey-data/random'

const RESPONSE_COUNT = 50_000
const BATCH_SIZE = 5_000
const SEED = 20261102

if (existsSync('.env')) process.loadEnvFile('.env')
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set. Add it to .env.')

function insertBatch(batch: NewResponse[]) {
  const column = <T>(pick: (row: NewResponse) => T) => sql.param(batch.map(pick))
  return sql`
    insert into ${responses} (
      show_id, platform, region, age_group, gender, wave,
      awareness, intent, satisfaction, would_recommend
    )
    select * from unnest(
      ${column((row) => row.showId)}::integer[],
      ${column((row) => row.platform)}::platform[],
      ${column((row) => row.region)}::region[],
      ${column((row) => row.ageGroup)}::age_group[],
      ${column((row) => row.gender)}::gender[],
      ${column((row) => row.wave)}::date[],
      ${column((row) => row.awareness)}::smallint[],
      ${column((row) => row.intent)}::smallint[],
      ${column((row) => row.satisfaction)}::smallint[],
      ${column((row) => row.wouldRecommend)}::boolean[]
    )
  `
}

const started = performance.now()
const elapsed = (since: number) => `${Math.round(performance.now() - since)}ms`

async function main() {
  const random = createRandom(SEED)
  const today = new Date()
  const waves = lastWaves(today)
  const pool = new Pool({ connectionString: url })
  const db = drizzle({ client: pool, schema })

  try {
    await db.transaction(async (tx) => {
      let step = performance.now()
      await tx.execute(sql`truncate table ${responses}, ${shows} restart identity cascade`)
      console.log(`Cleared existing data in ${elapsed(step)}`)

      step = performance.now()
      const inserted = await tx
        .insert(shows)
        .values(CATALOGUE.map((show) => ({ ...show })))
        .returning({ id: shows.id, title: shows.title })
      const idByTitle = new Map(inserted.map((row) => [row.title, row.id]))
      const catalogue = CATALOGUE.map((show) => ({ ...show, id: idByTitle.get(show.title) ?? 0 }))
      console.log(`Inserted ${inserted.length} shows in ${elapsed(step)}`)

      step = performance.now()
      const profiles = profileShows(catalogue, random, waves)
      const rows = generateResponses(profiles, waves, RESPONSE_COUNT, random)
      console.log(`Generated ${rows.length.toLocaleString('en-GB')} responses in ${elapsed(step)}`)

      step = performance.now()
      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batchStarted = performance.now()
        await tx.execute(insertBatch(rows.slice(start, start + BATCH_SIZE)))
        const done = Math.min(start + BATCH_SIZE, rows.length)
        console.log(`  ${done.toLocaleString('en-GB')} responses (${elapsed(batchStarted)})`)
      }
      console.log(`Inserted ${rows.length.toLocaleString('en-GB')} responses in ${elapsed(step)}`)
    })

    const step = performance.now()
    await db.execute(sql`analyze ${shows}, ${responses}`)
    console.log(`Analyzed tables in ${elapsed(step)}`)
    console.log(`Waves ${waves[0]} to ${waves.at(-1)}. Done in ${elapsed(started)}`)
    console.log('Ask the data answers are cached per data version: run `pnpm warm:ask --reset` (add the site URL for production).')
  } finally {
    await pool.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
