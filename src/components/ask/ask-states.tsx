import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type StateCardProps = {
  title: string
  tone?: 'info' | 'warning'
  children?: ReactNode
}

export function StateCard({ title, tone = 'info', children }: StateCardProps) {
  return (
    <div
      role={tone === 'warning' ? 'alert' : 'status'}
      className={cn('rounded-lg border p-6', tone === 'warning' && 'border-destructive/40')}
    >
      <p className="text-lg font-medium">{title}</p>
      {children ? <div className="mt-2 text-muted-foreground">{children}</div> : null}
    </div>
  )
}

// Laid out like an answer so nothing jumps when it arrives.
export function AskLoading({ question }: { question: string }) {
  return (
    <div aria-busy className="rounded-lg border p-6">
      <p role="status" className="text-muted-foreground">
        Asking the data: “{question}”
      </p>
      <div aria-hidden className="mt-4 space-y-3 motion-safe:animate-pulse">
        <div className="h-6 w-3/4 rounded-sm bg-muted" />
        <div className="h-4 w-1/3 rounded-sm bg-muted" />
        <div className="mt-6 h-chart rounded-md bg-muted" />
      </div>
    </div>
  )
}
