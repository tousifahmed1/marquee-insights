import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { ContentPage } from '@/components/content-page'
import { NowShowing } from '@/components/reports/now-showing'
import { getLatestReport, getPage } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [page, latest] = await Promise.all([getPage({ data: { slug: 'home' } }), getLatestReport()])
    if (!page) throw notFound()
    return { page, latest }
  },
  head: ({ loaderData, match }) =>
    loaderData
      ? seoHead(resolveSeo(match.context.siteSettings, { seo: loaderData.page.seo, path: '/' }))
      : {},
  headers: () => cacheHeaders('content'),
  component: HomePage,
})

function HomePage() {
  const { page, latest } = Route.useLoaderData()
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
