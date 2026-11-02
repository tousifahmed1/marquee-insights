import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { ContentPage } from '@/components/content-page'
import { getPage } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/')({
  loader: async () => {
    const page = await getPage({ data: { slug: 'home' } })
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData, match }) =>
    seoHead(resolveSeo(match.context.siteSettings, { seo: loaderData?.seo, path: '/' })),
  headers: () => cacheHeaders('content'),
  component: HomePage,
})

function HomePage() {
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
      <ContentPage page={Route.useLoaderData()} />
    </div>
  )
}
