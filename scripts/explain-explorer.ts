import { existsSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import type { Db } from '../src/data/db'
import { parseExplorerQuery } from '../src/data/filters'
import {
  awarenessByAgeGroupQuery,
  countQuery,
  intentByPlatformQuery,
  rowsQuery,
} from '../src/data/queries'
import * as schema from '../src/data/schema'

const RUNS = 5
const BUDGET_MS = 200

if (existsSync('.env')) process.loadEnvFile('.env')
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set. Add it to .env.')

const client = neon(url)
const db: Db = drizzle({ client, schema })

const scenarios: Record<string, unknown> = {
  'No filters': {},
  'Platform + region': { platform: 'lumen-plus', region: 'south' },
  'Genre + age, by awareness': { genre: 'drama', ageGroup: '55+', sort: 'awareness' },
  'Show + wave range': { show: 1, waveFrom: '2026-03', waveTo: '2026-08' },
  'Min awareness 80, by intent': { minAwareness: 80, sort: 'intent' },
  'Every filter': {
    genre: 'crime',
    platform: 'lumen-plus',
    region: 'west',
    ageGroup: '35-44',
    waveFrom: '2026-01',
    waveTo: '2026-10',
    minAwareness: 40,
  },
  'Sort by show, page 100': { sort: 'show', dir: 'asc', page: 100 },
  'Deepest page (offset 49,900)': { page: 500, pageSize: 100 },
}

type PlanNode = { 'Node Type': string; 'Index Name'?: string; Plans?: PlanNode[] }
type Plan = { 'Execution Time': number; 'Planning Time': number; Plan: PlanNode }

function indexesIn(node: PlanNode): string[] {
  const own = node['Index Name'] ? [node['Index Name'].replace(/^responses_|_idx$/g, '')] : []
  return [...own, ...(node.Plans ?? []).flatMap(indexesIn)]
}

async function explain(query: { toSQL: () => { sql: string; params: unknown[] } }) {
  const { sql, params } = query.toSQL()
  const times: number[] = []
  let indexes: string[] = []
  for (let run = 0; run < RUNS; run++) {
    const [row] = (await client.query(`explain (analyze, format json) ${sql}`, params)) as {
      'QUERY PLAN': Plan[]
    }[]
    const plan = row?.['QUERY PLAN'][0]
    if (!plan) throw new Error('No plan returned')
    times.push(plan['Execution Time'] + plan['Planning Time'])
    indexes = indexesIn(plan.Plan)
  }
  times.sort((a, b) => a - b)
  return { ms: times[Math.floor(RUNS / 2)] ?? 0, indexes }
}

async function roundTrip(run: () => Promise<unknown>) {
  await run()
  const started = performance.now()
  await run()
  return Math.round(performance.now() - started)
}

const report: Record<string, string | number>[] = []
let slowest = 0

for (const [name, input] of Object.entries(scenarios)) {
  const query = parseExplorerQuery(input)
  const parts = {
    rows: rowsQuery(db, query),
    count: countQuery(db, query),
    platform: intentByPlatformQuery(db, query),
    age: awarenessByAgeGroupQuery(db, query),
  }
  const results = Object.fromEntries(
    await Promise.all(
      Object.entries(parts).map(async ([key, part]) => [key, await explain(part)] as const),
    ),
  )
  const [counted] = await countQuery(db, query)
  const rowsTrip = await roundTrip(() => db.batch([rowsQuery(db, query), countQuery(db, query)]))
  const chartsTrip = await roundTrip(() =>
    db.batch([intentByPlatformQuery(db, query), awarenessByAgeGroupQuery(db, query)]),
  )
  for (const result of Object.values(results)) slowest = Math.max(slowest, result.ms)
  report.push({
    scenario: name,
    matches: counted?.total ?? 0,
    'rows ms': +results.rows!.ms.toFixed(1),
    'count ms': +results.count!.ms.toFixed(1),
    'platform ms': +results.platform!.ms.toFixed(1),
    'age ms': +results.age!.ms.toFixed(1),
    'rows/count indexes': [...new Set([...results.rows!.indexes, ...results.count!.indexes])].join(', ') || 'seq scan',
    'rows trip ms': rowsTrip,
    'charts trip ms': chartsTrip,
  })
}

console.log(`Postgres time per query (planning + execution, median of ${RUNS} runs):`)
console.table(report)
console.log(`Slowest query: ${slowest.toFixed(1)}ms (budget ${BUDGET_MS}ms)`)
if (slowest >= BUDGET_MS) process.exitCode = 1
