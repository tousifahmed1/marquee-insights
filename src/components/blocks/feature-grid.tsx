import { Container } from '@/components/container'
import { Section } from '@/components/section'
import type { FeatureGridBlock } from '@/content'

import type { BlockProps } from './block-props'
import { FeatureIcon } from './feature-icon'

export function FeatureGrid({ block }: BlockProps<FeatureGridBlock>) {
  return (
    <Section>
      <Container>
        {block.heading ? <h2 className="max-w-3xl text-4xl">{block.heading}</h2> : null}
        <ul className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => (
            <li key={item._key} className="border-t pt-6">
              <FeatureIcon name={item.icon} className="size-6 text-primary" />
              <h3 className="mt-4 font-sans text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
