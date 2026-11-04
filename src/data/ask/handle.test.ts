import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMemoryKv } from '@/lib/edge'

import { DAILY_MODEL_CALLS, createBudget } from './budget'
import { createAnswerCache } from './cache'
import type { QueryResult } from './db'
import { EXAMPLE_QUESTIONS } from './examples'
import { handleAsk } from './handle'
import type { HandleDeps } from './handle'
import type { GenerateResult, Llm } from './llm'

const reply = JSON.stringify({
  answerable: true,
  sql: 'select count(*) as responses from responses',
  answer_template: '{responses} responses.',
  chart: 'none',
  reason: '',
})

const result: QueryResult = { columns: ['responses'], rows: [{ responses: 50000 }], rowCount: 1 }

function setup(options: { turnstile?: boolean } = {}) {
  const kv = createMemoryKv()
  const budget = createBudget({ kv })
  const calls = { model: 0 }
  const llm: Llm = {
    generate: async (): Promise<GenerateResult> => {
      calls.model += 1
      await budget.recordCall('gemini')
      return { ok: true, provider: 'gemini', text: reply, ms: 3 }
    },
  }
  const verifyTurnstile = vi.fn(async () => options.turnstile ?? true)
  const deps: HandleDeps = {
    llm,
    validate: (sql) => ({ ok: true, sql }),
    run: async () => result,
    cache: createAnswerCache(kv),
    budget,
    verifyTurnstile,
  }
  return { deps, calls, verifyTurnstile, budget }
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('handleAsk', () => {
  it('verifies Turnstile and counts the IP for a new question, then serves repeats from the cache', async () => {
    const { deps, calls, verifyTurnstile } = setup()
    const first = await handleAsk({ question: 'How many?', turnstileToken: 't', ip: '203.0.113.9' }, deps)
    expect(first).toMatchObject({ status: 'answered', cached: false })
    expect(verifyTurnstile).toHaveBeenCalledWith('t', '203.0.113.9')

    const second = await handleAsk({ question: 'how many', ip: '203.0.113.9' }, deps)
    expect(second).toMatchObject({ status: 'answered', cached: true, modelCalls: 0 })
    expect(calls.model).toBe(1)
    expect(verifyTurnstile).toHaveBeenCalledTimes(1)
    expect((await deps.budget.status()).cache).toEqual({ hits: 1, misses: 1 })
  })

  it('rejects a failed Turnstile check before any model call', async () => {
    const { deps, calls } = setup({ turnstile: false })
    const outcome = await handleAsk({ question: 'How many?', turnstileToken: 'bad', ip: '203.0.113.9' }, deps)
    expect(outcome).toMatchObject({ status: 'unverified', modelCalls: 0 })
    expect(calls.model).toBe(0)
  })

  it('rate limits the sixth new question from one IP in an hour', async () => {
    const { deps, calls } = setup()
    for (let i = 0; i < 5; i += 1) {
      expect(await handleAsk({ question: `Question ${i}?`, turnstileToken: 't', ip: '203.0.113.9' }, deps)).toMatchObject({ status: 'answered' })
    }
    expect(await handleAsk({ question: 'Question 6?', turnstileToken: 't', ip: '203.0.113.9' }, deps)).toMatchObject({ status: 'rate-limited' })
    expect(await handleAsk({ question: 'Question 0?', ip: '203.0.113.9' }, deps)).toMatchObject({ status: 'answered', cached: true })
    expect(calls.model).toBe(5)
  })

  it('lets example questions skip Turnstile and the IP limit', async () => {
    const { deps, verifyTurnstile } = setup({ turnstile: false })
    const example = EXAMPLE_QUESTIONS[0]
    expect(await handleAsk({ question: example, ip: '203.0.113.9' }, deps)).toMatchObject({ status: 'answered' })
    expect(verifyTurnstile).not.toHaveBeenCalled()
  })

  it('stops new questions once the daily budget is spent, while cached ones keep working', async () => {
    const { deps, budget, calls } = setup()
    await handleAsk({ question: 'Cached one?', turnstileToken: 't', ip: '203.0.113.9' }, deps)
    for (let i = calls.model; i < DAILY_MODEL_CALLS; i += 1) await budget.recordCall('gemini')
    expect(await handleAsk({ question: 'New one?', turnstileToken: 't', ip: '203.0.113.9' }, deps)).toMatchObject({ status: 'over-budget', modelCalls: 0 })
    expect(await handleAsk({ question: EXAMPLE_QUESTIONS[1], ip: null }, deps)).toMatchObject({ status: 'over-budget' })
    expect(await handleAsk({ question: 'cached one', ip: '203.0.113.9' }, deps)).toMatchObject({ status: 'answered', cached: true })
    expect(calls.model).toBe(1)
  })

  it('logs one line per question', async () => {
    const { deps } = setup()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await handleAsk({ question: 'How many?', turnstileToken: 't', ip: '203.0.113.9' }, deps)
    const line = info.mock.calls.map((call) => String(call[0])).find((text) => text.includes('"event":"ask"'))
    expect(line && JSON.parse(line)).toMatchObject({
      event: 'ask',
      cache: 'miss',
      provider: 'gemini',
      sql: 'select count(*) as responses from responses',
      rows: 1,
      modelCalls: 1,
    })
  })
})
