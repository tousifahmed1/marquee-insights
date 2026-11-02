import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type SectionProps = ComponentProps<'section'> & {
  tone?: 'default' | 'muted'
}

export function Section({
  tone = 'default',
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        'py-section',
        tone === 'muted' && 'bg-muted text-foreground',
        className,
      )}
      {...props}
    />
  )
}
