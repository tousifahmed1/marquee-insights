import { CmsLink } from '@/components/cms-link'
import { Container } from '@/components/container'
import { Section } from '@/components/section'
import { Button } from '@/components/ui/button'
import type { CtaBannerBlock } from '@/content'

import type { BlockProps } from './block-props'

export function CtaBanner({ block }: BlockProps<CtaBannerBlock>) {
  return (
    <Section className="bg-primary text-primary-foreground">
      <Container className="grid items-end gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="max-w-3xl text-5xl break-words">{block.heading}</h2>
          {block.text ? <p className="mt-6 max-w-prose text-lg">{block.text}</p> : null}
        </div>
        <Button
          size="lg"
          asChild
          className="h-auto min-h-11 max-w-full justify-self-start bg-primary-foreground py-2 text-primary whitespace-normal hover:bg-primary-foreground/85 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/50"
        >
          <CmsLink href={block.button.href}>{block.button.label}</CmsLink>
        </Button>
      </Container>
    </Section>
  )
}
