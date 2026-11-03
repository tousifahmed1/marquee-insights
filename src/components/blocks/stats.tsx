import { Container } from '@/components/container'
import { Section } from '@/components/section'
import type { StatsBlock } from '@/content'

import type { BlockProps } from './block-props'

export function Stats({ block }: BlockProps<StatsBlock>) {
  return (
    <Section tone="muted" data-scroll-moment="stats">
      <Container>
        {block.heading ? <h2 className="text-3xl">{block.heading}</h2> : null}
        <dl className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((item) => (
            <div key={item._key} className="relative flex flex-col-reverse justify-end gap-3 pt-6">
              <span
                aria-hidden
                data-scroll-moment="rule"
                className="absolute inset-x-0 top-0 h-px bg-border"
              />
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-display text-5xl">
                <span className="sr-only">{item.value}</span>
                {/* Drawn from the attribute so the count-up never puts a second copy in the page text. */}
                <span
                  aria-hidden
                  data-scroll-moment="value"
                  data-value={item.value}
                  className="before:content-[attr(data-value)]"
                />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}
