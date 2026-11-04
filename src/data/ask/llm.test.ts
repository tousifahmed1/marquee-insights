import { describe, expect, it, vi } from 'vitest'

import { createMemoryKv } from '@/lib/edge'

import {
  ProviderError,
  createLlm,
  exhaustedUntil,
  groqClient,
  nextUtcMidnight,
  retryDelayFromMessage,
} from './llm'
import type { Prompt, ProviderClient } from './llm'

const prompt: Prompt = { system: 'sys', user: 'question', schema: { type: 'object' } }
const NOON = Date.UTC(2026, 10, 5, 12, 0, 0)

function fakeProvider(
  name: ProviderClient['name'],
  behave: () => Promise<string>,
): ProviderClient & { calls: number } {
  const client = {
    name,
    calls: 0,
    complete: () => {
      client.calls += 1
      return behave()
    },
  }
  return client
}

function setup(behaviours: { gemini: () => Promise<string>; groq: () => Promise<string> }) {
  let now = NOON
  const kv = createMemoryKv(() => now)
  const gemini = fakeProvider('gemini', behaviours.gemini)
  const groq = fakeProvider('groq', behaviours.groq)
  const llm = createLlm({ providers: [gemini, groq], kv, now: () => now, timeoutMs: 50 })
  return { llm, gemini, groq, kv, advance: (ms: number) => (now += ms) }
}

const answers = (text: string) => () => Promise.resolve(text)
const quota = (retryAfterSeconds?: number) => () =>
  Promise.reject(new ProviderError('quota', 'quota', retryAfterSeconds))

describe('createLlm', () => {
  it('answers with Gemini first and never touches Groq', async () => {
    const { llm, gemini, groq } = setup({ gemini: answers('{"a":1}'), groq: answers('groq') })
    const result = await llm.generate(prompt)
    expect(result).toMatchObject({ ok: true, provider: 'gemini', text: '{"a":1}' })
    expect(gemini.calls).toBe(1)
    expect(groq.calls).toBe(0)
  })

  it('falls back to Groq on a quota error and marks Gemini exhausted until UTC midnight', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { llm, gemini, groq, kv } = setup({ gemini: quota(), groq: answers('groq') })
    const result = await llm.generate(prompt)
    expect(result).toMatchObject({ ok: true, provider: 'groq', text: 'groq' })
    expect(await kv.get('ask:exhausted:gemini')).toBe('2026-11-06T00:00:00.000Z')

    await llm.generate(prompt)
    expect(gemini.calls).toBe(1)
    expect(groq.calls).toBe(2)
  })

  it('keeps a short mark for a per-minute limit and tries Gemini again after it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { llm, gemini, advance } = setup({ gemini: quota(30), groq: answers('groq') })
    await llm.generate(prompt)
    advance(30 * 1000)
    await llm.generate(prompt)
    expect(gemini.calls).toBe(1)
    advance(31 * 1000)
    await llm.generate(prompt)
    expect(gemini.calls).toBe(2)
  })

  it('returns out-of-capacity with zero calls when both are exhausted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { llm, gemini, groq } = setup({ gemini: quota(), groq: quota() })
    expect(await llm.generate(prompt)).toMatchObject({ ok: false, error: 'out-of-capacity' })
    expect(await llm.generate(prompt)).toMatchObject({ ok: false, error: 'out-of-capacity' })
    expect(gemini.calls).toBe(1)
    expect(groq.calls).toBe(1)
  })

  it('tries the next provider on other errors without marking anything', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { llm, kv } = setup({
      gemini: () => Promise.reject(new Error('500')),
      groq: answers('groq'),
    })
    expect(await llm.generate(prompt)).toMatchObject({ ok: true, provider: 'groq' })
    expect(await kv.get('ask:exhausted:gemini')).toBeNull()
  })

  it('fails when every provider errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { llm } = setup({
      gemini: () => Promise.reject(new Error('500')),
      groq: () => Promise.reject(new Error('502')),
    })
    expect(await llm.generate(prompt)).toMatchObject({ ok: false, error: 'failed' })
  })

  it('aborts a provider that takes longer than the timeout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const kv = createMemoryKv()
    const slow: ProviderClient = {
      name: 'gemini',
      complete: (_prompt, signal) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    }
    const llm = createLlm({ providers: [slow], kv, timeoutMs: 20 })
    expect(await llm.generate(prompt)).toMatchObject({ ok: false, error: 'failed' })
  })

  it('fails without any provider', async () => {
    const llm = createLlm({ providers: [], kv: createMemoryKv() })
    expect(await llm.generate(prompt)).toMatchObject({ ok: false, error: 'failed' })
  })
})

describe('exhaustedUntil', () => {
  it('holds until the next UTC midnight by default', () => {
    expect(nextUtcMidnight(NOON)).toBe('2026-11-06T00:00:00.000Z')
    expect(exhaustedUntil(NOON)).toBe('2026-11-06T00:00:00.000Z')
    expect(exhaustedUntil(NOON, 7200)).toBe('2026-11-06T00:00:00.000Z')
  })

  it('uses a short retry delay, never under the KV minimum', () => {
    expect(exhaustedUntil(NOON, 45)).toBe('2026-11-05T12:01:00.000Z')
    expect(exhaustedUntil(NOON, 90)).toBe('2026-11-05T12:01:30.000Z')
  })
})

describe('retryDelayFromMessage', () => {
  it('reads the delay out of a Gemini 429 body', () => {
    expect(retryDelayFromMessage('quota exceeded. Please retry in 32.5s.')).toBe(33)
    expect(retryDelayFromMessage('{"retryDelay":"12s"}')).toBe(12)
    expect(retryDelayFromMessage('no delay here')).toBeUndefined()
  })
})

describe('groqClient', () => {
  it('throws a quota error with the retry-after header on 429', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response('slow down', { status: 429, headers: { 'retry-after': '12' } }),
    )
    const client = groqClient('key', fetchImpl as unknown as typeof fetch)
    const error = await client.complete(prompt, new AbortController().signal).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ProviderError)
    expect(error).toMatchObject({ kind: 'quota', retryAfterSeconds: 12 })
  })

  it('returns the message content on success', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ choices: [{ message: { content: '{"ok":true}' } }] }),
    )
    const client = groqClient('key', fetchImpl as unknown as typeof fetch)
    expect(await client.complete(prompt, new AbortController().signal)).toBe('{"ok":true}')
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_schema' },
    })
  })
})
