import { env } from 'cloudflare:workers'

import { createMemoryKv } from '@/lib/edge'
import type { EdgeKv } from '@/lib/edge'
import { serverSecret } from '@/lib/server-env'

import { createReadOnlyRunner } from './db'
import type { RunQuery } from './db'
import { createLlm, geminiClient, groqClient } from './llm'
import type { Llm, ProviderClient } from './llm'

// Server-only wiring for Ask the data: the KV namespace, the model clients and
// the read-only database runner, all from the Worker bindings.

// Lives as long as the isolate, for environments without the binding (tests).
const memoryKv = createMemoryKv()

export function getAskKv(): EdgeKv {
  const kv = env.ASK_CACHE
  return typeof kv === 'object' && kv !== null ? (kv as EdgeKv) : memoryKv
}

let llm: Llm | undefined

export function getLlm(): Llm {
  if (llm) return llm
  const providers: ProviderClient[] = []
  const geminiKey = serverSecret('GEMINI_API_KEY')
  const groqKey = serverSecret('GROQ_API_KEY')
  if (geminiKey) providers.push(geminiClient(geminiKey))
  if (groqKey) providers.push(groqClient(groqKey))
  llm = createLlm({ providers, kv: getAskKv() })
  return llm
}

let runner: RunQuery | undefined

export function getAskRunner(): RunQuery {
  if (runner) return runner
  const url = serverSecret('DATABASE_URL_READONLY')
  if (!url) throw new Error('DATABASE_URL_READONLY is not set')
  runner = createReadOnlyRunner(url)
  return runner
}
