import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type ContainerProps = ComponentProps<'div'> & {
  width?: 'page' | 'prose'
}

export function Container({
  width = 'page',
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-gutter',
        width === 'page' ? 'max-w-page' : 'max-w-prose',
        className,
      )}
      {...props}
    />
  )
}
