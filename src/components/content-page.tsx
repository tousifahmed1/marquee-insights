import { SectionRenderer } from '@/components/blocks/section-renderer'
import type { Page } from '@/content'

export function ContentPage({ page }: { page: Page }) {
  const hasHero = page.sections.some((section) => section._type === 'hero')
  return (
    <>
      {hasHero ? null : <h1 className="sr-only">{page.title}</h1>}
      <SectionRenderer sections={page.sections} />
    </>
  )
}
