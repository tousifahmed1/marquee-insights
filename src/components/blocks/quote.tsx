import { Container } from '@/components/container'
import { Section } from '@/components/section'
import type { QuoteBlock } from '@/content'

import type { BlockProps } from './block-props'

export function Quote({ block }: BlockProps<QuoteBlock>) {
  return (
    <Section>
      <Container width="prose">
        <figure className="border-l-4 border-primary pl-8">
          <blockquote className="font-display text-3xl text-balance">
            <p>“{block.text}”</p>
          </blockquote>
          <figcaption className="mt-6 text-muted-foreground">
            <span className="font-medium text-foreground">{block.author}</span>
            {block.role ? <span>, {block.role}</span> : null}
          </figcaption>
        </figure>
      </Container>
    </Section>
  )
}
