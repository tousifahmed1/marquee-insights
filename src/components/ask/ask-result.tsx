import { AnimatePresence, motion } from 'motion/react'

import type { AskOutcome } from '@/data/ask/pipeline'

import { AnswerCard } from './answer-card'
import { AskLoading, StateCard } from './ask-states'

type AskResultProps = {
  question: string
  pending: boolean
  failed: boolean
  outcome: AskOutcome | undefined
}

const TRANSITION = { duration: 0.25, ease: 'easeOut' as const }

// Each state fades and rises in as the previous one fades out, so the change
// from loading to answer is visible rather than a jump. Opacity and transform
// only; MotionConfig turns the transform off for reduced motion.
export function AskResult(props: AskResultProps) {
  const content = resultContent(props)
  return (
    <AnimatePresence mode="wait" initial={false}>
      {content ? (
        <motion.div
          key={content.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          transition={TRANSITION}
        >
          {content.node}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function resultContent({ question, pending, failed, outcome }: AskResultProps) {
  if (pending) return { key: `loading:${question}`, node: <AskLoading question={question} /> }
  if (failed) {
    return {
      key: 'network',
      node: (
        <StateCard title="Something went wrong." tone="warning">
          The request did not complete. Check your connection and try again.
        </StateCard>
      ),
    }
  }
  if (!outcome) return null
  const key = `${outcome.status}:${outcome.question}`

  switch (outcome.status) {
    case 'answered':
      return { key, node: <AnswerCard answer={outcome} /> }
    case 'refused':
      return {
        key,
        node: (
          <StateCard title="The data can’t answer that.">
            {outcome.reason}
            {outcome.cached ? <span className="ml-2 text-xs">(cached)</span> : null}
          </StateCard>
        ),
      }
    case 'rate-limited':
      return { key, node: <StateCard title="Slow down a little." tone="warning">{outcome.message}</StateCard> }
    case 'over-budget':
      return { key, node: <StateCard title="Today’s free limit is used up.">{outcome.message}</StateCard> }
    case 'out-of-capacity':
      return {
        key,
        node: (
          <StateCard title="The AI models are out of capacity right now.">
            Both free providers have hit their limits. The examples still work from the cache; try a
            new question later.
          </StateCard>
        ),
      }
    case 'unverified':
      return { key, node: <StateCard title="Verification failed." tone="warning">{outcome.message}</StateCard> }
    case 'failed':
      return { key, node: <StateCard title="No answer this time." tone="warning">{outcome.message}</StateCard> }
  }
}
