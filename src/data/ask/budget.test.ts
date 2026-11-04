import { describe, expect, it } from 'vitest'

import { createMemoryKv } from '@/lib/edge'

import { DAILY_MODEL_CALLS, IP_QUESTIONS_PER_HOUR, createBudget } from './budget'

const NOON = Date.UTC(2026, 10, 5, 12, 0, 0)

describe('createBudget', () => {
  it('counts model calls per provider and stops at the daily limit', async () => {
    const budget = createBudget({ kv: createMemoryKv(() => NOON), now: () => NOON })
    expect(await budget.canCall()).toBe(true)
    for (let i = 0; i < DAILY_MODEL_CALLS; i += 1) {
      await budget.recordCall(i % 3 === 0 ? 'groq' : 'gemini')
    }
    expect(await budget.canCall()).toBe(false)
    expect(await budget.status()).toMatchObject({
      day: '2026-11-05',
      modelCalls: { total: 250, gemini: 166, groq: 84 },
      remaining: 0,
      limit: 250,
    })
  })

  it('starts afresh the next UTC day', async () => {
    let now = NOON
    const budget = createBudget({ kv: createMemoryKv(() => now), now: () => now })
    for (let i = 0; i < DAILY_MODEL_CALLS; i += 1) await budget.recordCall('gemini')
    expect(await budget.canCall()).toBe(false)
    now = Date.UTC(2026, 10, 6, 0, 0, 1)
    expect(await budget.canCall()).toBe(true)
    expect((await budget.status()).modelCalls.total).toBe(0)
  })

  it('allows five questions per IP per hour and never stores the raw IP', async () => {
    let now = NOON
    const kv = createMemoryKv(() => now)
    const budget = createBudget({ kv, now: () => now, salt: 'pepper' })
    for (let i = 0; i < IP_QUESTIONS_PER_HOUR; i += 1) expect(await budget.allowIp('203.0.113.9')).toBe(true)
    expect(await budget.allowIp('203.0.113.9')).toBe(false)
    expect(await budget.allowIp('203.0.113.10')).toBe(true)
    expect([...kv.entries.keys()].some((key) => key.includes('203.0.113'))).toBe(false)

    now = NOON + 61 * 60 * 1000
    expect(await budget.allowIp('203.0.113.9')).toBe(true)
  })

  it('counts cache hits and misses', async () => {
    const budget = createBudget({ kv: createMemoryKv(() => NOON), now: () => NOON })
    await budget.recordCache('hit')
    await budget.recordCache('hit')
    await budget.recordCache('miss')
    expect((await budget.status()).cache).toEqual({ hits: 2, misses: 1 })
  })

  it('fails open on a broken KV', async () => {
    const kv = createMemoryKv()
    kv.get = async () => {
      throw new Error('kv down')
    }
    const budget = createBudget({ kv })
    expect(await budget.canCall()).toBe(true)
  })
})
