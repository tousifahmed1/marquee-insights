import { formatInteger } from '@/lib/format'

type ResultsStatusProps = {
  total: number | undefined
  updating: boolean
}

export function ResultsStatus({ total, updating }: ResultsStatusProps) {
  return (
    <p className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
      <span>
        {total === undefined
          ? 'Responses unavailable'
          : `${formatInteger(total)} ${total === 1 ? 'response' : 'responses'}`}
      </span>
      {updating ? (
        <span className="inline-flex items-center gap-2 text-foreground">
          <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden />
          Updating…
        </span>
      ) : null}
    </p>
  )
}
