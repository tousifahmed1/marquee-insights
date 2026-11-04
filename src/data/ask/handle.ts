import type { AnswerCache } from './cache'
import type { Budget } from './budget'
import { isExampleQuestion } from './examples'
import { ask } from './pipeline'
import type { AskDeps, AskOutcome, Failure } from './pipeline'
import type { VerifyTurnstile } from './turnstile'

// Everything that stands between a visitor and a model call, in order: the
// cache (free, no checks), the daily budget, the per-IP limit, Turnstile.
// Example questions skip the IP limit and Turnstile: they are ours.

export const OVER_BUDGET_MESSAGE =
  "Ask the data has hit today's free limit. Try one of the examples, or come back tomorrow."
export const RATE_LIMITED_MESSAGE =
  'You have asked five new questions this hour. Cached answers and the examples still work; try again in a while.'
export const UNVERIFIED_MESSAGE = 'The anti-bot check did not pass. Reload the page and try again.'

export type AskRequest = { question: string; turnstileToken?: string; ip: string | null }

export type HandleDeps = AskDeps & {
  cache: AnswerCache
  budget: Budget
  verifyTurnstile: VerifyTurnstile
  now?: () => number
}

export async function handleAsk(request: AskRequest, deps: HandleDeps): Promise<AskOutcome> {
  const { budget, verifyTurnstile, now = Date.now } = deps
  const { question, ip } = request
  const example = isExampleQuestion(question)

  const beforeModel = async (): Promise<Failure | null> => {
    const started = now()
    const fail = (status: Failure['status'], message: string): Failure => ({
      status,
      question,
      message,
      modelCalls: 0,
      timings: { model: 0, query: 0, total: now() - started },
    })
    if (!(await budget.canCall())) return fail('over-budget', OVER_BUDGET_MESSAGE)
    if (example) return null
    if (ip !== null && !(await budget.allowIp(ip))) return fail('rate-limited', RATE_LIMITED_MESSAGE)
    if (!(await verifyTurnstile(request.turnstileToken, ip))) return fail('unverified', UNVERIFIED_MESSAGE)
    return null
  }

  const outcome = await ask(question, { ...deps, beforeModel, canRetry: budget.canCall })
  const cached = 'cached' in outcome && outcome.cached
  if (outcome.status === 'answered' || outcome.status === 'refused') {
    await budget.recordCache(cached ? 'hit' : 'miss')
  }
  console.info(
    JSON.stringify({
      event: 'ask',
      question,
      example,
      status: outcome.status,
      cache: cached ? 'hit' : 'miss',
      provider: 'provider' in outcome ? outcome.provider : null,
      sql: outcome.status === 'answered' ? outcome.sql : null,
      rows: outcome.status === 'answered' ? outcome.rowCount : null,
      modelCalls: outcome.modelCalls,
      timings: outcome.timings,
    }),
  )
  return outcome
}
