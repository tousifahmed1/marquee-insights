import { CmsImage } from '@/components/cms-image'
import { CmsLink } from '@/components/cms-link'
import { Container } from '@/components/container'
import { Section } from '@/components/section'
import { Button } from '@/components/ui/button'
import type { HeroBlock } from '@/content'
import { cn } from '@/lib/utils'

import type { BlockProps } from './block-props'

export function Hero({ block, isPageHeading }: BlockProps<HeroBlock>) {
  const Heading = isPageHeading ? 'h1' : 'h2'
  const hasCtas = block.primaryCta || block.secondaryCta

  return (
    <Section>
      <Container
        className={cn(block.image && 'grid items-center gap-12 md:grid-cols-[1.15fr_1fr]')}
      >
        <div>
          {block.eyebrow ? (
            <p className="mb-6 text-sm font-medium text-primary">{block.eyebrow}</p>
          ) : null}
          <Heading className="max-w-4xl text-6xl">{block.heading}</Heading>
          {block.subheading ? (
            <p className="mt-8 max-w-prose text-lg text-muted-foreground">{block.subheading}</p>
          ) : null}
          {hasCtas ? (
            <div className="mt-10 flex flex-wrap gap-3">
              {block.primaryCta ? (
                <Button size="lg" asChild>
                  <CmsLink href={block.primaryCta.href}>{block.primaryCta.label}</CmsLink>
                </Button>
              ) : null}
              {block.secondaryCta ? (
                <Button size="lg" variant="outline" asChild>
                  <CmsLink href={block.secondaryCta.href}>{block.secondaryCta.label}</CmsLink>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {block.image ? (
          <CmsImage
            image={block.image}
            aspectRatio={4 / 5}
            sizes="(min-width: 76rem) 34rem, (min-width: 48rem) 45vw, 100vw"
            priority={isPageHeading}
            className="rounded-lg"
          />
        ) : null}
      </Container>
    </Section>
  )
}
