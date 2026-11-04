import { useEffect, useRef } from 'react'

import { ContentPage } from '@/components/content-page'
import { NowShowing } from '@/components/reports/now-showing'
import type { Page, ReportSummary } from '@/content'

type HomePageProps = { page: Page; latest: ReportSummary | null }

// The home page and its preview: CMS sections, the newest report beside the
// hero and the GSAP scroll moment, loaded after mount unless motion is reduced.
export function HomePage({ page, latest }: HomePageProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cleanup: (() => void) | undefined
    let cancelled = false
    void import('@/lib/motion/home-scroll-moment').then(({ setupHomeScrollMoment }) => {
      if (!cancelled) cleanup = setupHomeScrollMoment(root)
    })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div ref={ref}>
      <ContentPage page={page} heroAside={latest ? <NowShowing report={latest} /> : null} />
    </div>
  )
}
