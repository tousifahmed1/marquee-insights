import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

const ACROSS = 13
const DOWN = 7

// Bulbs in the order a chase runs: clockwise from the top left.
const EDGES = [
  { count: ACROSS, className: 'inset-x-4 -top-1 flex-row', offset: 0 },
  { count: DOWN, className: 'inset-y-4 -right-1 flex-col', offset: ACROSS },
  { count: ACROSS, className: 'inset-x-4 -bottom-1 flex-row-reverse', offset: ACROSS + DOWN },
  { count: DOWN, className: 'inset-y-4 -left-1 flex-col-reverse', offset: ACROSS * 2 + DOWN },
]

type MarqueeFrameProps = {
  children: ReactNode
  className?: string
}

// A sign ringed with bulbs. They are drawn lit, so first paint is the finished
// frame, and chase once around it on load unless motion is reduced.
export function MarqueeFrame({ children, className }: MarqueeFrameProps) {
  return (
    <div className={cn('relative rounded-lg border-2 border-primary/40 bg-card', className)}>
      {EDGES.map((edge) => (
        <div
          key={edge.offset}
          aria-hidden
          className={cn('pointer-events-none absolute flex justify-between', edge.className)}
        >
          {Array.from({ length: edge.count }, (_, index) => (
            <span
              key={index}
              style={{ '--bulb': edge.offset + index } as CSSProperties}
              className="size-2 rounded-full bg-primary shadow-bulb motion-safe:animate-bulb-chase motion-safe:[animation-delay:calc(var(--bulb)*var(--delay-bulb-step))]"
            />
          ))}
        </div>
      ))}
      <div className="relative p-8 md:p-10">{children}</div>
    </div>
  )
}
