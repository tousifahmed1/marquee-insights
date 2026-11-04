import type { AnswerCache } from './cache'
import type { Row, RunQuery } from './db'
import type { Llm, Provider } from './llm'
import { buildPrompt } from './prompt'
import { parseReply } from './reply'
import type { ChartKind } from './reply'
import { answerFrom } from './template'

// One question in, one outcome out. A cached answer costs nothing. Otherwise
// at most two model calls (the second only after a validation failure, and
// only if the budget allows) and one query, and the outcome is cached.

export const MAX_ROWS = 100
export const UNSAFE_MESSAGE = "I couldn't answer that safely. Try rephrasing or use one of the examples."
export const FAILED_MESSAGE = 'Something went wrong running that question. Please try again.'

export type Validation = { ok: true; sql: string } | { ok: false; error: string }
export type Validate = (sql: string) => Validation

type Timings = { model: number; query: number; total: number }

export type Answer = {
  status: 'answered'
  question: string
  sql: string
  answer: string
  template: string
  chart: ChartKind
  columns: string[]
  rows: Row[]
  rowCount: number
  provider: Provider
  cached: boolean
  modelCalls: number
  timings: Timings
}

export type Refusal = {
  status: 'refused'
  question: string
  reason: string
  provider: Provider
  cached: boolean
  modelCalls: number
  timings: Timings
}

export type Failure = {
  status: 'failed' | 'out-of-capacity' | 'over-budget' | 'rate-limited' | 'unverified'
  question: string
  message: string
  modelCalls: number
  timings: Timings
}

export type AskOutcome = Answer | Refusal | Failure

export type AskDeps = {
  llm: Llm
  validate: Validate
  run: RunQuery
  cache?: AnswerCache
  // Runs after a cache miss and before the first model call; a Failure stops
  // the question there (budget, rate limit, Turnstile).
  beforeModel?: () => Promise<Failure | null>
  // Whether a second model call is allowed right now (the daily budget).
  canRetry?: () => Promise<boolean>
  now?: () => number
}

type Attempt =
  | { kind: 'sql'; sql: string; template: string; chart: ChartKind; provider: Provider }
  | { kind: 'refused'; reason: string; provider: Provider }
  | { kind: 'invalid'; error: string; provider: Provider }
  | { kind: 'unavailable'; status: Failure['status']; message: string }

export async function ask(question: string, deps: AskDeps): Promise<AskOutcome> {
  const { cache, now = Date.now } = deps
  const started = now()
  const hit = await cache?.get(question)
  if (hit) {
    return { ...hit, cached: true, modelCalls: 0, timings: { model: 0, query: 0, total: now() - started } }
  }
  const stopped = await deps.beforeModel?.()
  if (stopped) return stopped
  const outcome = await generateAnswer(question, deps, started)
  if (cache && (outcome.status === 'answered' || outcome.status === 'refused')) {
    await cache.put(question, outcome)
  }
  return outcome
}

async function generateAnswer(question: string, deps: AskDeps, started: number): Promise<AskOutcome> {
  const { llm, validate, run, canRetry = async () => true, now = Date.now } = deps
  let modelMs = 0
  let modelCalls = 0

  const attempt = async (validationError?: string): Promise<Attempt> => {
    modelCalls += 1
    const generated = await llm.generate(buildPrompt(question, validationError))
    modelMs += generated.ms
    if (!generated.ok) {
      return {
        kind: 'unavailable',
        status: generated.error === 'out-of-capacity' ? 'out-of-capacity' : 'failed',
        message: generated.message,
      }
    }
    const reply = parseReply(generated.text)
    if (!reply) return { kind: 'invalid', error: 'the reply was not the JSON object asked for', provider: generated.provider }
    if (!reply.answerable) return { kind: 'refused', reason: reply.reason, provider: generated.provider }
    const validation = validate(reply.sql)
    if (!validation.ok) return { kind: 'invalid', error: validation.error, provider: generated.provider }
    return { kind: 'sql', sql: validation.sql, template: reply.answer_template, chart: reply.chart, provider: generated.provider }
  }

  const timings = (query = 0): Timings => ({ model: modelMs, query, total: now() - started })

  let result = await attempt()
  if (result.kind === 'invalid') {
    console.warn(JSON.stringify({ event: 'ask-invalid-sql', question, error: result.error, retry: await canRetry() }))
    result = (await canRetry()) ? await attempt(result.error) : result
  }

  if (result.kind === 'unavailable') {
    return { status: result.status, question, message: result.message, modelCalls, timings: timings() }
  }
  if (result.kind === 'invalid') {
    return { status: 'failed', question, message: UNSAFE_MESSAGE, modelCalls, timings: timings() }
  }
  if (result.kind === 'refused') {
    return { status: 'refused', question, reason: result.reason, provider: result.provider, cached: false, modelCalls, timings: timings() }
  }

  const queryStarted = now()
  let queried
  try {
    queried = await run(result.sql)
  } catch (error) {
    console.error(JSON.stringify({ event: 'ask-query-failed', question, sql: result.sql, message: error instanceof Error ? error.message : String(error) }))
    return { status: 'failed', question, message: FAILED_MESSAGE, modelCalls, timings: timings(now() - queryStarted) }
  }
  const rows = queried.rows.slice(0, MAX_ROWS)
  return {
    status: 'answered',
    question,
    sql: result.sql,
    answer: answerFrom(result.template, rows),
    template: result.template,
    chart: rows.length > 1 ? result.chart : 'none',
    columns: queried.columns,
    rows,
    rowCount: queried.rowCount,
    provider: result.provider,
    cached: false,
    modelCalls,
    timings: timings(now() - queryStarted),
  }
}
