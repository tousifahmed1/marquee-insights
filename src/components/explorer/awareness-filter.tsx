import { useId, useState } from 'react'

import { Slider } from '@/components/ui/slider'

type AwarenessFilterProps = {
  value: number | undefined
  onCommit: (value: number | undefined) => void
}

export function AwarenessFilter({ value, onCommit }: AwarenessFilterProps) {
  const id = useId()
  const [draft, setDraft] = useState(value ?? 0)
  const [committed, setCommitted] = useState(value)
  if (committed !== value) {
    setCommitted(value)
    setDraft(value ?? 0)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span id={id} className="text-sm leading-none font-medium">
          Minimum awareness
        </span>
        <output aria-hidden className="text-sm text-muted-foreground tabular-nums">
          {draft === 0 ? 'Any' : `${draft}+`}
        </output>
      </div>
      <Slider
        aria-labelledby={id}
        aria-valuetext={draft === 0 ? 'Any awareness' : `${draft} or more`}
        min={0}
        max={100}
        step={5}
        value={[draft]}
        onValueChange={([next]) => setDraft(next ?? 0)}
        onValueCommit={([next]) => onCommit(next ? next : undefined)}
      />
    </div>
  )
}
