import type { ReactNode } from 'react'

import { Container } from '@/components/container'
import { Section } from '@/components/section'

type StatusPageProps = {
  code: string
  title: string
  // Which of the marquee's seven bulbs are still lit.
  lit: boolean[]
  children: ReactNode
  actions: ReactNode
}

export function StatusPage({ code, title, lit, children, actions }: StatusPageProps) {
  return (
    <Section>
      <Container width="prose">
        <div aria-hidden className="flex gap-3">
          {lit.map((on, index) => (
            <span
              key={index}
              className={on ? 'size-3 rounded-full bg-primary' : 'size-3 rounded-full bg-muted'}
            />
          ))}
        </div>
        <p className="mt-8 font-display text-6xl text-muted-foreground">{code}</p>
        <h1 className="mt-2 text-5xl">{title}</h1>
        <div className="mt-6 text-lg text-muted-foreground">{children}</div>
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
      </Container>
    </Section>
  )
}
