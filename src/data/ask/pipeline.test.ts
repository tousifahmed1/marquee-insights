import { describe, expect, it, vi } from 'vitest'

import { createMemoryKv } from '@/lib/edge'

import { createAnswerCache } from './cache'
import type { QueryResult } from './db'
import type { GenerateResult, Llm } from './llm'
import { FAILED_MESSAGE, UNSAFE_MESSAGE, ask } from './pipeline'
import type { Validate } from './pipeline'

const reply = (fields: Partial<Record<string, unknown>>) =>
  JSON.stringify({
    answerable: true,
    sql: 'select count(*) as responses from responses',
    answer_template: 'There are {responses} responses.',
    chart: 'none',
    reason: '',
    ...fields,
  })

function fakeLlm(texts: (string | GenerateResult)[]): Llm & { calls: number } {
  const llm = {
    calls: 0,
    generate: async (): Promise<GenerateResult> => {
      const next = texts[llm.calls] ?? texts.at(-1) ?? ''
      llm.calls += 1
      return typeof next === 'string' ? { ok: true, provider: 'gemini', text: next, ms: 5 } : next
    },
  }
  return llm
}

const passAll: Validate = (sql) => ({ ok: true, sql })
const result: QueryResult = { columns: ['responses'], rows: [{ responses: 50000 }], rowCount: 1 }

describe('ask', () => {
  it('answers with the template filled from the first row', async () => {
    const llm = fakeLlm([reply({})])
    const run = vi.fn(async () => result)
    const outcome = await ask('How many responses?', { llm, validate: passAll, run })
    expect(outcome).toMatchObject({
      status: 'answered',
      answer: 'There are 50,000 responses.',
      sql: 'select count(*) as responses from responses',
      provider: 'gemini',
      modelCalls: 1,
      rows: [{ responses: 50000 }],
    })
    expect(run).toHaveBeenCalledWith('select count(*) as responses from responses')
  })

  it('returns a refusal without touching the database', async () => {
    const llm = fakeLlm([reply({ answerable: false, sql: '', reason: 'The survey has no future data.' })])
    const run = vi.fn(async () => result)
    const outcome = await ask('Next month?', { llm, validate: passAll, run })
    expect(outcome).toMatchObject({ status: 'refused', reason: 'The survey has no future data.' })
    expect(run).not.toHaveBeenCalled()
  })

  it('retries once with the validation error, then uses the rewritten SQL', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const llm = fakeLlm([reply({ sql: 'delete from shows' }), reply({})])
    const validate: Validate = (sql) =>
      sql.startsWith('select') ? { ok: true, sql } : { ok: false, error: 'only SELECT is allowed' }
    const outcome = await ask('q', { llm, validate, run: async () => result })
    expect(outcome).toMatchObject({ status: 'answered', modelCalls: 2 })
    expect(llm.calls).toBe(2)
  })

  it('fails safely when the retry is also rejected', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const llm = fakeLlm([reply({ sql: 'delete from shows' })])
    const validate: Validate = () => ({ ok: false, error: 'no' })
    const run = vi.fn(async () => result)
    const outcome = await ask('q', { llm, validate, run })
    expect(outcome).toMatchObject({ status: 'failed', message: UNSAFE_MESSAGE, modelCalls: 2 })
    expect(run).not.toHaveBeenCalled()
  })

  it('does not retry when the budget says no', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const llm = fakeLlm(['not json'])
    const outcome = await ask('q', { llm, validate: passAll, run: async () => result, canRetry: async () => false })
    expect(outcome).toMatchObject({ status: 'failed', modelCalls: 1 })
  })

  it('passes out-of-capacity through', async () => {
    const llm = fakeLlm([{ ok: false, error: 'out-of-capacity', message: 'none left', ms: 1 }])
    const outcome = await ask('q', { llm, validate: passAll, run: async () => result })
    expect(outcome).toMatchObject({ status: 'out-of-capacity', modelCalls: 1 })
  })

  it('reports a query failure without leaking the error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const llm = fakeLlm([reply({})])
    const run = async () => {
      throw new Error('canceling statement due to statement timeout')
    }
    const outcome = await ask('q', { llm, validate: passAll, run })
    expect(outcome).toMatchObject({ status: 'failed', message: FAILED_MESSAGE })
  })

  it('serves a cached answer with zero model calls and no query', async () => {
    const cache = createAnswerCache(createMemoryKv())
    const llm = fakeLlm([reply({})])
    const run = vi.fn(async () => result)
    const first = await ask('How many responses?', { llm, validate: passAll, run, cache })
    expect(first).toMatchObject({ status: 'answered', cached: false, modelCalls: 1 })

    const second = await ask('how many   responses', { llm, validate: passAll, run, cache })
    expect(second).toMatchObject({
      status: 'answered',
      cached: true,
      modelCalls: 0,
      answer: 'There are 50,000 responses.',
      timings: { model: 0, query: 0 },
    })
    expect(llm.calls).toBe(1)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('caches refusals but not failures', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cache = createAnswerCache(createMemoryKv())
    const refusing = fakeLlm([reply({ answerable: false, sql: '', reason: 'future' })])
    await ask('Next month?', { llm: refusing, validate: passAll, run: async () => result, cache })
    expect(await cache.get('Next month?')).toMatchObject({ status: 'refused', cached: true })

    const failing = fakeLlm(['not json'])
    await ask('q', { llm: failing, validate: passAll, run: async () => result, cache })
    expect(await cache.get('q')).toBeNull()
  })

  it('falls back to the neutral sentence and drops the chart for a single row', async () => {
    const llm = fakeLlm([reply({ answer_template: '{missing} wins.', chart: 'bar' })])
    const outcome = await ask('q', { llm, validate: passAll, run: async () => result })
    expect(outcome).toMatchObject({ status: 'answered', answer: "Here's what the data shows.", chart: 'none' })
  })
})
