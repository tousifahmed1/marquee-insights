import type { ReactNode } from 'react'

import { Container } from '@/components/container'
import { Section } from '@/components/section'

type PageIntroProps = {
  title: string
  children?: ReactNode
}

export function PageIntro({ title, children }: PageIntroProps) {
  return (
    <Section>
      <Container width="prose">
        <h1 className="text-5xl">{title}</h1>
        {children ? (
          <div className="mt-6 text-lg text-muted-foreground">{children}</div>
        ) : null}
      </Container>
    </Section>
  )
}
