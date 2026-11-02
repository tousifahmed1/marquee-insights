import { Container } from '@/components/container'
import { Section } from '@/components/section'
import type { StatsBlock } from '@/content'

import type { BlockProps } from './block-props'

export function Stats({ block }: BlockProps<StatsBlock>) {
  return (
    <Section tone="muted">
      <Container>
        {block.heading ? <h2 className="text-3xl">{block.heading}</h2> : null}
        <dl className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((item) => (
            <div key={item._key} className="flex flex-col-reverse justify-end gap-3 border-t pt-6">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-display text-5xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  )
}
