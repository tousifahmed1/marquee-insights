import type { EdgeKv } from '@/lib/edge'

import type { Answer, Refusal } from './pipeline'

// Answers are cached in KV under the normalised question's hash and the data
// version. The data is static, so entries never expire; a reseed bumps the
// version (pnpm warm:ask --reset) and every old entry is simply never read.
// Refusals are cached too, so a repeated off-topic question costs nothing.

export const DATA_VERSION_KEY = 'ask:data-version'
const ANSWER_KEY_PREFIX = 'ask:answer:'

export type Cacheable = Answer | Refusal

export type AnswerCache = {
  get(question: string): Promise<Cacheable | null>
  put(question: string, outcome: Cacheable): Promise<void>
  dataVersion(): Promise<string>
  resetDataVersion(): Promise<string>
}

export function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\s.!?,;:]+$/u, '')
}

export async function questionHash(question: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeQuestion(question))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

export function createAnswerCache(kv: EdgeKv, now: () => number = Date.now): AnswerCache {
  const dataVersion = async () => {
    try {
      return (await kv.get(DATA_VERSION_KEY)) ?? '0'
    } catch (error) {
      console.error('[ask] data version read failed', error)
      return null
    }
  }
  const key = async (question: string) => {
    const version = await dataVersion()
    return version === null ? null : `${ANSWER_KEY_PREFIX}v${version}:${await questionHash(question)}`
  }
  return {
    dataVersion: async () => (await dataVersion()) ?? '0',
    resetDataVersion: async () => {
      const version = String(now())
      await kv.put(DATA_VERSION_KEY, version)
      return version
    },
    get: async (question) => {
      try {
        const k = await key(question)
        const stored = k === null ? null : await kv.get(k)
        return stored === null ? null : (JSON.parse(stored) as Cacheable)
      } catch (error) {
        console.error('[ask] cache read failed', error)
        return null
      }
    },
    put: async (question, outcome) => {
      try {
        const k = await key(question)
        if (k !== null) await kv.put(k, JSON.stringify({ ...outcome, cached: true }))
      } catch (error) {
        console.error('[ask] cache write failed', error)
      }
    },
  }
}
