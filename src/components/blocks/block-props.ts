import type { ReactNode } from 'react'

export type BlockProps<T> = {
  block: T
  isPageHeading: boolean
  // Shown beside the page's first hero when it has no image.
  aside?: ReactNode
}
