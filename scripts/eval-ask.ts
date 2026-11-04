import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { createReadOnlyRunner } from '../src/data/ask/db'
import type { Row } from '../src/data/ask/db'
import { createLlm, geminiClient, groqClient } from '../src/data/ask/llm'
import type { Provider, ProviderClient } from '../src/data/ask/llm'
import { ask } from '../src/data/ask/pipeline'
import { validateSql } from '../src/data/ask/validate'
import { createMemoryKv } from '../src/lib/edge'
import { CASES, REFUSALS } from '../tests/ask/cases'

// Runs the evaluation set through the real pipeline (no cache) and compares
// rows with the reference SQL. Usage: pnpm eval:ask [--provider gemini|groq]
// [--only-failed] [--check]. See tests/ask/README.md.

if (existsSync('.env')) process.loadEnvFile('.env')

// Failures are kept per provider choice so parallel runs don't clobber each other.
const lastRunFile = (provider: string | undefined) => `tests/ask/.last-run-${provider ?? 'all'}.json`
// Free-tier pacing: Gemini 3.5 Flash-Lite allows 10 requests a minute, Groq
// 8,000 tokens a minute (about four of these prompts).
const PACE_MS: Record<Provider, number> = { gemini: 6500, groq: 16_000 }
const EXHAUSTED_WAIT_MS = 61_000

const args = process.argv.slice(2)
const flag = (name: string) => {
  const index = args.indexOf(name)
  return index === -1 ? undefined : (args[index + 1] ?? '')
}
const providerArg = flag('--provider')
const onlyFailed = args.includes('--only-failed')
const checkOnly = args.includes('--check')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function normalise(value: unknown): string {
  if (typeof value === 'number') return value.toFixed(1)
  if (typeof value === 'string') {
    const date = /^(\d{4}-\d{2})/.exec(value)
    if (date) return date[1] as string
    const numeric = Number(value)
    if (value.trim() !== '' && Number.isFinite(numeric)) return numeric.toFixed(1)
    return value.trim().toLowerCase()
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

// A reference row matches a model row when every reference value appears in
// it (a fraction also matches its percentage).
function rowMatches(reference: Row, candidate: Row): boolean {
  const have = new Set(Object.values(candidate).map(normalise))
  return Object.values(reference).every((value) => {
    const wanted = normalise(value)
    if (have.has(wanted)) return true
    const number = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(number) && (have.has((number / 100).toFixed(1)) || have.has((number * 100).toFixed(1)))
  })
}

function compareRows(reference: Row[], candidate: Row[], mode: 'all' | 'first'): string | null {
  if (mode === 'first') {
    const [want] = reference
    const [got] = candidate
    if (!want || !got) return 'no first row'
    return rowMatches(want, got) ? null : `first row differs: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`
  }
  if (reference.length !== candidate.length) {
    return `expected ${reference.length} rows, got ${candidate.length}`
  }
  const unmatched = [...candidate]
  for (const want of reference) {
    const index = unmatched.findIndex((got) => rowMatches(want, got))
    if (index === -1) return `no row matches ${JSON.stringify(want)}`
    unmatched.splice(index, 1)
  }
  return null
}

type Result = { id: string; pass: boolean; detail: string; provider?: Provider; modelCalls: number; ms: number }

async function main() {
  const run = createReadOnlyRunner(required('DATABASE_URL_READONLY'))
  const previousFailures = new Set<string>(
    onlyFailed && existsSync(lastRunFile(providerArg)) ? (JSON.parse(readFileSync(lastRunFile(providerArg), 'utf8')) as string[]) : [],
  )
  const cases = CASES.filter((c) => !onlyFailed || previousFailures.has(c.id))
  const refusals = REFUSALS.filter((c) => !onlyFailed || previousFailures.has(c.id))

  if (checkOnly) {
    for (const c of cases) {
      const result = await run(validatedReference(c.sql))
      console.log(`ok   ${String(result.rowCount).padStart(3)} rows  ${c.id}  ${JSON.stringify(result.rows[0])}`)
    }
    return
  }

  const providers: ProviderClient[] = []
  if (providerArg !== 'groq') providers.push(geminiClient(required('GEMINI_API_KEY')))
  if (providerArg !== 'gemini') providers.push(groqClient(required('GROQ_API_KEY')))
  const llm = createLlm({ providers, kv: createMemoryKv() })
  const pace = PACE_MS[providerArg === 'groq' ? 'groq' : 'gemini']
  const calls: Record<Provider, number> = { gemini: 0, groq: 0 }
  const results: Result[] = []
  const started = performance.now()

  const askPaced = async (question: string) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const outcome = await ask(question, { llm, validate: validateSql, run })
      if (outcome.status !== 'out-of-capacity') return outcome
      console.log('     providers exhausted, waiting a minute…')
      await sleep(EXHAUSTED_WAIT_MS)
    }
    return ask(question, { llm, validate: validateSql, run })
  }

  for (const c of cases) {
    const caseStarted = performance.now()
    const outcome = await askPaced(c.question)
    const ms = Math.round(performance.now() - caseStarted)
    let detail: string
    let pass = false
    if (outcome.status === 'answered') {
      const reference = await run(validatedReference(c.sql))
      const mismatch = compareRows(reference.rows, outcome.rows, c.compare)
      pass = mismatch === null
      detail = mismatch ?? ''
      if (!pass) detail += `\n       model SQL: ${outcome.sql}`
    } else {
      detail = `${outcome.status}: ${'reason' in outcome ? outcome.reason : outcome.message}`
    }
    const provider = 'provider' in outcome ? outcome.provider : undefined
    if (provider) calls[provider] += outcome.modelCalls
    else if (providers.length === 1) calls[providers[0]!.name] += outcome.modelCalls
    results.push({ id: c.id, pass, detail, provider, modelCalls: outcome.modelCalls, ms })
    report(results.at(-1)!, c.question)
    await sleep(pace)
  }

  for (const c of refusals) {
    const caseStarted = performance.now()
    const outcome = await askPaced(c.question)
    const ms = Math.round(performance.now() - caseStarted)
    const pass = outcome.status === 'refused'
    const provider = 'provider' in outcome ? outcome.provider : undefined
    if (provider) calls[provider] += outcome.modelCalls
    const detail = pass ? '' : `${outcome.status}${outcome.status === 'answered' ? `: ${outcome.sql}` : ''}`
    results.push({ id: c.id, pass, detail, provider, modelCalls: outcome.modelCalls, ms })
    report(results.at(-1)!, c.question)
    await sleep(pace)
  }

  const answered = results.filter((r) => cases.some((c) => c.id === r.id))
  const refused = results.filter((r) => refusals.some((c) => c.id === r.id))
  const failures = results.filter((r) => !r.pass).map((r) => r.id)
  writeFileSync(lastRunFile(providerArg), JSON.stringify(failures, null, 2))

  console.log('')
  console.log(`Answerable: ${answered.filter((r) => r.pass).length}/${answered.length}   Refusals: ${refused.filter((r) => r.pass).length}/${refused.length}`)
  console.log(`Model calls: ${calls.gemini + calls.groq} (gemini ${calls.gemini}, groq ${calls.groq})   ${Math.round((performance.now() - started) / 1000)}s`)
  const avg = (list: Result[]) => (list.length ? Math.round(list.reduce((s, r) => s + r.ms, 0) / list.length) : 0)
  console.log(`Average time per question: ${avg(results)}ms`)
  if (failures.length) {
    console.log(`Failed: ${failures.join(', ')}  (rerun with --only-failed)`)
    process.exitCode = 1
  }
}

function report(result: Result, question: string) {
  const mark = result.pass ? 'PASS' : 'FAIL'
  console.log(`${mark} ${String(result.ms).padStart(6)}ms ${(result.provider ?? '-').padEnd(6)} ${result.id}  ${question}`)
  if (result.detail) console.log(`       ${result.detail}`)
}

function validatedReference(sql: string): string {
  const result = validateSql(sql)
  if (!result.ok) throw new Error(`reference SQL rejected: ${result.error}\n${sql}`)
  return result.sql
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set. Add it to .env.`)
  return value
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
