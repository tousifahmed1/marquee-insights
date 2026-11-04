import type { AskOutcome } from '@/data/ask/pipeline'

import { AnswerCard } from './answer-card'
import { AskLoading, StateCard } from './ask-states'

type AskResultProps = {
  question: string
  pending: boolean
  failed: boolean
  outcome: AskOutcome | undefined
}

export function AskResult({ question, pending, failed, outcome }: AskResultProps) {
  if (pending) return <AskLoading question={question} />
  if (failed) {
    return (
      <StateCard title="Something went wrong." tone="warning">
        The request did not complete. Check your connection and try again.
      </StateCard>
    )
  }
  if (!outcome) return null

  switch (outcome.status) {
    case 'answered':
      return <AnswerCard answer={outcome} />
    case 'refused':
      return (
        <StateCard title="The data can’t answer that.">
          {outcome.reason}
          {outcome.cached ? <span className="ml-2 text-xs">(cached)</span> : null}
        </StateCard>
      )
    case 'rate-limited':
      return <StateCard title="Slow down a little." tone="warning">{outcome.message}</StateCard>
    case 'over-budget':
      return <StateCard title="Today’s free limit is used up.">{outcome.message}</StateCard>
    case 'out-of-capacity':
      return (
        <StateCard title="The AI models are out of capacity right now.">
          Both free providers have hit their limits. The examples still work from the cache; try a
          new question later.
        </StateCard>
      )
    case 'unverified':
      return <StateCard title="Verification failed." tone="warning">{outcome.message}</StateCard>
    case 'failed':
      return <StateCard title="No answer this time." tone="warning">{outcome.message}</StateCard>
  }
}
