import { CmsLink } from '@/components/cms-link'
import { Container } from '@/components/container'
import { Section } from '@/components/section'
import { Button } from '@/components/ui/button'
import type { CtaBannerBlock } from '@/content'

import type { BlockProps } from './block-props'

export function CtaBanner({ block }: BlockProps<CtaBannerBlock>) {
  return (
    <Section>
      <Container>
        <div className="grid items-center gap-8 rounded-lg border bg-card p-10 shadow-md md:grid-cols-[1fr_auto] md:p-14">
          <div>
            <h2 className="text-4xl">{block.heading}</h2>
            {block.text ? (
              <p className="mt-4 max-w-prose text-muted-foreground">{block.text}</p>
            ) : null}
          </div>
          <Button size="lg" asChild>
            <CmsLink href={block.button.href}>{block.button.label}</CmsLink>
          </Button>
        </div>
      </Container>
    </Section>
  )
}
