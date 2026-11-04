import { env } from 'cloudflare:workers'

import { createMemoryKv } from '@/lib/edge'
import type { EdgeKv } from '@/lib/edge'
import { secretsMatch } from '@/lib/preview-session'
import { serverSecret } from '@/lib/server-env'

import { createAnswerCache } from './cache'
import type { AnswerCache } from './cache'
import { createReadOnlyRunner } from './db'
import type { RunQuery } from './db'
import { createLlm, geminiClient, groqClient } from './llm'
import type { Llm, ProviderClient } from './llm'
import type { AskDeps } from './pipeline'
import { validateSql } from './validate'

// Server-only wiring for Ask the data: the KV namespace, the model clients,
// the answer cache and the read-only database runner, from the Worker bindings.

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

let cache: AnswerCache | undefined

export function getAnswerCache(): AnswerCache {
  cache ??= createAnswerCache(getAskKv())
  return cache
}

export function askDeps(): AskDeps {
  return { llm: getLlm(), validate: validateSql, run: getAskRunner(), cache: getAnswerCache() }
}

// Admin routes send the secret in the x-ask-admin header.
export async function isAdminRequest(request: Request): Promise<boolean> {
  const secret = serverSecret('ASK_ADMIN_SECRET')
  const given = request.headers.get('x-ask-admin')
  return !!secret && !!given && secretsMatch(given, secret)
}
