import { Container } from '@/components/container'
import { Section } from '@/components/section'
import type { QuoteBlock } from '@/content'

import type { BlockProps } from './block-props'

export function Quote({ block }: BlockProps<QuoteBlock>) {
  return (
    <Section>
      <Container width="prose">
        <figure>
          <blockquote className="font-display text-4xl text-balance">
            <p className="relative">
              <span className="block text-6xl leading-none text-highlight md:absolute md:right-full md:mr-4">
                “
              </span>
              {block.text}”
            </p>
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4 text-muted-foreground">
            <span aria-hidden className="h-0.5 w-10 shrink-0 bg-primary" />
            <span>
              <span className="font-medium text-foreground">{block.author}</span>
              {block.role ? <span>, {block.role}</span> : null}
            </span>
          </figcaption>
        </figure>
      </Container>
    </Section>
  )
}
