import { PortableText } from '@portabletext/react'

import type { RichTextNode } from '@/content'
import { cn } from '@/lib/utils'

import { richTextComponents } from './rich-text-components'

type RichTextProps = {
  value: readonly RichTextNode[]
  className?: string
}

export function RichText({ value, className }: RichTextProps) {
  if (value.length === 0) return null
  return (
    <div className={cn('[&>:first-child]:mt-0', className)}>
      <PortableText value={[...value]} components={richTextComponents} onMissingComponent={false} />
    </div>
  )
}
