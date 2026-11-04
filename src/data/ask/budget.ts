import type { EdgeKv } from '@/lib/edge'

import type { Provider } from './llm'

// Counters in KV, all keyed by UTC day so they reset at midnight: model calls
// (total and per provider), cache hits and misses, and per-IP question counts
// per hour. KV is eventually consistent, so the counts are approximate, which
// is fine for a free-tier guard. IPs are stored only as a salted hash that
// expires with its hour.

export const DAILY_MODEL_CALLS = 250
export const IP_QUESTIONS_PER_HOUR = 5

const DAY_TTL_SECONDS = 2 * 86_400
const HOUR_TTL_SECONDS = 3600 + 60

export type Budget = {
  canCall(): Promise<boolean>
  recordCall(provider: Provider): Promise<void>
  recordCache(result: 'hit' | 'miss'): Promise<void>
  allowIp(ip: string): Promise<boolean>
  status(): Promise<BudgetStatus>
}

export type BudgetStatus = {
  day: string
  modelCalls: { total: number; gemini: number; groq: number }
  remaining: number
  limit: number
  cache: { hits: number; misses: number }
}

type BudgetDeps = { kv: EdgeKv; now?: () => number; salt?: string }

export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10)
const utcHour = (now: number) => new Date(now).toISOString().slice(0, 13)

export function createBudget({ kv, now = Date.now, salt = '' }: BudgetDeps): Budget {
  const read = async (key: string) => {
    try {
      return Number((await kv.get(key)) ?? 0)
    } catch (error) {
      console.error('[ask] counter read failed', error)
      return 0
    }
  }
  const bump = async (key: string, ttl: number) => {
    try {
      const next = (await read(key)) + 1
      await kv.put(key, String(next), { expirationTtl: ttl })
      return next
    } catch (error) {
      console.error('[ask] counter write failed', error)
      return 0
    }
  }
  const dayKey = (name: string) => `ask:${name}:${utcDay(now())}`

  return {
    canCall: async () => (await read(dayKey('calls'))) < DAILY_MODEL_CALLS,
    recordCall: async (provider) => {
      await bump(dayKey('calls'), DAY_TTL_SECONDS)
      await bump(dayKey(`calls:${provider}`), DAY_TTL_SECONDS)
    },
    recordCache: async (result) => {
      await bump(dayKey(result === 'hit' ? 'hits' : 'misses'), DAY_TTL_SECONDS)
    },
    allowIp: async (ip) => {
      const key = `ask:ip:${await hashIp(ip, salt)}:${utcHour(now())}`
      if ((await read(key)) >= IP_QUESTIONS_PER_HOUR) return false
      await bump(key, HOUR_TTL_SECONDS)
      return true
    },
    status: async () => {
      const [total, gemini, groq, hits, misses] = await Promise.all([
        read(dayKey('calls')),
        read(dayKey('calls:gemini')),
        read(dayKey('calls:groq')),
        read(dayKey('hits')),
        read(dayKey('misses')),
      ])
      return {
        day: utcDay(now()),
        modelCalls: { total, gemini, groq },
        remaining: Math.max(0, DAILY_MODEL_CALLS - total),
        limit: DAILY_MODEL_CALLS,
        cache: { hits, misses },
      }
    },
  }
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24)
}
