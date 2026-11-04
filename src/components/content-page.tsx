import type { ReactNode } from 'react'

import { SectionRenderer } from '@/components/blocks/section-renderer'
import type { Page } from '@/content'

export function ContentPage({ page, heroAside }: { page: Page; heroAside?: ReactNode }) {
  const hasHero = page.sections.some((section) => section._type === 'hero')
  return (
    <>
      {hasHero ? null : <h1 className="sr-only">{page.title}</h1>}
      <SectionRenderer sections={page.sections} heroAside={heroAside} />
    </>
  )
}
