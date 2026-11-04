import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai/web'

import type { EdgeKv } from '@/lib/edge'

// Every model call goes through generate(). Gemini answers first; a 429 or
// quota error marks it exhausted in KV (until the next UTC midnight, or for the
// retry delay the provider asked for when that is under an hour) and Groq takes
// over. With both exhausted the result is out-of-capacity and nothing is called.

export type Provider = 'gemini' | 'groq'

export const GEMINI_MODEL = 'gemini-3.5-flash-lite'
export const GROQ_MODEL = 'openai/gpt-oss-120b'
export const MAX_OUTPUT_TOKENS = 800
export const TIMEOUT_MS = 15_000

const EXHAUSTED_KEY_PREFIX = 'ask:exhausted:'
const KV_MIN_TTL_SECONDS = 60
const HOUR_SECONDS = 3600

export type Prompt = {
  system: string
  user: string
  // JSON Schema for the reply. Both providers enforce it server-side.
  schema: Record<string, unknown>
}

export type GenerateResult =
  | { ok: true; provider: Provider; text: string; ms: number }
  | { ok: false; error: 'out-of-capacity' | 'failed'; message: string; ms: number }

export type Llm = { generate(prompt: Prompt): Promise<GenerateResult> }

export type ProviderClient = {
  name: Provider
  complete(prompt: Prompt, signal: AbortSignal): Promise<string>
}

// Thrown by a client when the provider refused for quota or rate reasons.
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly kind: 'quota' | 'other',
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

type LlmDeps = {
  providers: ProviderClient[]
  kv: EdgeKv
  now?: () => number
  timeoutMs?: number
}

export function createLlm({ providers, kv, now = Date.now, timeoutMs = TIMEOUT_MS }: LlmDeps): Llm {
  return {
    async generate(prompt) {
      const started = now()
      let exhausted = 0
      for (const provider of providers) {
        if (await isExhausted(kv, provider.name)) {
          exhausted += 1
          continue
        }
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const text = await provider.complete(prompt, controller.signal)
          const ms = now() - started
          console.info(JSON.stringify({ event: 'ask-llm', provider: provider.name, ms }))
          return { ok: true, provider: provider.name, text, ms }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          if (error instanceof ProviderError && error.kind === 'quota') {
            const until = exhaustedUntil(now(), error.retryAfterSeconds)
            await markExhausted(kv, provider.name, until, now())
            console.warn(JSON.stringify({ event: 'ask-provider-exhausted', provider: provider.name, until, message }))
            exhausted += 1
          } else {
            console.error(JSON.stringify({ event: 'ask-provider-error', provider: provider.name, message }))
          }
        } finally {
          clearTimeout(timer)
        }
      }
      const ms = now() - started
      if (providers.length === 0) {
        return { ok: false, error: 'failed', message: 'No model provider is configured.', ms }
      }
      if (exhausted === providers.length) {
        return { ok: false, error: 'out-of-capacity', message: 'Every model provider is out of capacity.', ms }
      }
      return { ok: false, error: 'failed', message: 'Every model provider failed.', ms }
    },
  }
}

async function isExhausted(kv: EdgeKv, provider: Provider): Promise<boolean> {
  try {
    return (await kv.get(EXHAUSTED_KEY_PREFIX + provider)) !== null
  } catch {
    return false
  }
}

async function markExhausted(kv: EdgeKv, provider: Provider, until: string, now: number) {
  const seconds = Math.ceil((Date.parse(until) - now) / 1000)
  await kv.put(EXHAUSTED_KEY_PREFIX + provider, until, {
    expirationTtl: Math.max(KV_MIN_TTL_SECONDS, seconds),
  })
}

// A per-minute limit asks for a short retry, so the mark is short. A daily
// quota, or an error without a delay, holds until the next UTC midnight.
export function exhaustedUntil(now: number, retryAfterSeconds?: number): string {
  if (retryAfterSeconds !== undefined && retryAfterSeconds < HOUR_SECONDS) {
    return new Date(now + Math.max(KV_MIN_TTL_SECONDS, retryAfterSeconds) * 1000).toISOString()
  }
  return nextUtcMidnight(now)
}

export function nextUtcMidnight(now: number): string {
  const date = new Date(now)
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  ).toISOString()
}

export function geminiClient(apiKey: string): ProviderClient {
  const ai = new GoogleGenAI({ apiKey })
  return {
    name: 'gemini',
    async complete(prompt, signal) {
      let text: string | undefined
      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt.user,
          config: {
            systemInstruction: prompt.system,
            temperature: 0,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            responseMimeType: 'application/json',
            responseJsonSchema: prompt.schema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            abortSignal: signal,
            httpOptions: { timeout: TIMEOUT_MS, retryOptions: { attempts: 1 } },
          },
        })
        text = response.text
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          throw new ProviderError(error.message, 'quota', retryDelayFromMessage(error.message))
        }
        throw error
      }
      if (!text) throw new ProviderError('Gemini returned no text', 'other')
      return text
    },
  }
}

// Gemini's 429 body ends with "Please retry in 32.5s." and carries a
// RetryInfo detail like "retryDelay":"32s".
export function retryDelayFromMessage(message: string): number | undefined {
  const match = /retry in ([\d.]+)s|"retryDelay":\s*"([\d.]+)s"/i.exec(message)
  const seconds = Number(match?.[1] ?? match?.[2])
  return Number.isFinite(seconds) ? Math.ceil(seconds) : undefined
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export function groqClient(apiKey: string, fetchImpl: typeof fetch = fetch): ProviderClient {
  return {
    name: 'groq',
    async complete(prompt, signal) {
      const response = await fetchImpl(GROQ_URL, {
        method: 'POST',
        signal,
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          temperature: 0,
          // gpt-oss counts its reasoning tokens here, so leave room for them.
          max_completion_tokens: MAX_OUTPUT_TOKENS * 2,
          reasoning_effort: 'low',
          include_reasoning: false,
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'ask_reply', strict: true, schema: prompt.schema },
          },
        }),
      })
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after'))
        throw new ProviderError(
          `Groq rate limit: ${await response.text()}`,
          'quota',
          Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : undefined,
        )
      }
      if (!response.ok) {
        throw new ProviderError(`Groq ${response.status}: ${await response.text()}`, 'other')
      }
      const body: unknown = await response.json()
      const text = groqText(body)
      if (!text) throw new ProviderError('Groq returned no text', 'other')
      return text
    },
  }
}

function groqText(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('choices' in body)) return undefined
  const choices = body.choices
  if (!Array.isArray(choices)) return undefined
  const message: unknown = choices[0]?.message
  if (typeof message !== 'object' || message === null || !('content' in message)) return undefined
  return typeof message.content === 'string' ? message.content : undefined
}
