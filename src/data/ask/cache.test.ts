import { describe, expect, it } from 'vitest'

import { createMemoryKv } from '@/lib/edge'

import { createAnswerCache, normalizeQuestion, questionHash } from './cache'
import type { Answer } from './pipeline'

const answer: Answer = {
  status: 'answered',
  question: 'How many responses?',
  sql: 'SELECT COUNT(*) AS "responses" FROM "responses"',
  answer: 'There are 50,000 responses.',
  template: 'There are {responses} responses.',
  chart: 'none',
  columns: ['responses'],
  rows: [{ responses: 50000 }],
  rowCount: 1,
  provider: 'gemini',
  cached: false,
  modelCalls: 1,
  timings: { model: 900, query: 300, total: 1250 },
}

describe('normalizeQuestion', () => {
  it('lowercases, trims, collapses spaces and strips trailing punctuation', () => {
    expect(normalizeQuestion('  How   many Responses?!  ')).toBe('how many responses')
    expect(normalizeQuestion('Top five shows by satisfaction in the Midwest.')).toBe(
      'top five shows by satisfaction in the midwest',
    )
    expect(normalizeQuestion('What is 55+?')).toBe('what is 55+')
  })
})

describe('questionHash', () => {
  it('is the same for questions that normalise the same', async () => {
    expect(await questionHash('How many responses?')).toBe(await questionHash('how many   responses'))
    expect(await questionHash('a')).not.toBe(await questionHash('b'))
    expect(await questionHash('a')).toHaveLength(32)
  })
})

describe('createAnswerCache', () => {
  it('stores and finds an answer under the normalised question', async () => {
    const cache = createAnswerCache(createMemoryKv())
    expect(await cache.get('How many responses?')).toBeNull()
    await cache.put('How many responses?', answer)
    expect(await cache.get('how many responses')).toMatchObject({ ...answer, cached: true })
  })

  it('forgets everything when the data version changes', async () => {
    let now = 1000
    const cache = createAnswerCache(createMemoryKv(), () => now)
    await cache.put('q', answer)
    now = 2000
    expect(await cache.resetDataVersion()).toBe('2000')
    expect(await cache.get('q')).toBeNull()
    expect(await cache.dataVersion()).toBe('2000')
  })

  it('treats a broken KV as a miss', async () => {
    const kv = createMemoryKv()
    kv.get = async () => {
      throw new Error('kv down')
    }
    const cache = createAnswerCache(kv)
    expect(await cache.get('q')).toBeNull()
    await cache.put('q', answer)
  })
})
