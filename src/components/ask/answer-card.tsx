import type { Answer } from '@/data/ask/pipeline'

import { AnswerChart } from './answer-chart'
import { formatMs } from './format-cell'
import { ResultTable } from './result-table'
import { SqlPanel } from './sql-panel'

const PROVIDER_LABEL = { gemini: 'Gemini', groq: 'Groq' } as const

export function AnswerCard({ answer }: { answer: Answer }) {
  return (
    <article aria-labelledby="ask-answer" className="rounded-lg border bg-card p-6">
      <h2 id="ask-answer" className="font-sans text-xl leading-snug font-medium">
        {answer.answer}
      </h2>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
        {answer.cached ? (
          <>
            <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground">cached</span>
            <span>answered in {formatMs(answer.timings.total)}</span>
          </>
        ) : (
          <>
            <span>model {formatMs(answer.timings.model)}</span>
            <span>query {formatMs(answer.timings.query)}</span>
            <span>total {formatMs(answer.timings.total)}</span>
          </>
        )}
        <span>via {PROVIDER_LABEL[answer.provider]}</span>
      </p>
      {answer.chart !== 'none' ? (
        <AnswerChart kind={answer.chart} columns={answer.columns} rows={answer.rows} sql={answer.sql} />
      ) : null}
      <ResultTable columns={answer.columns} rows={answer.rows} rowCount={answer.rowCount} />
      <SqlPanel sql={answer.sql} />
    </article>
  )
}
