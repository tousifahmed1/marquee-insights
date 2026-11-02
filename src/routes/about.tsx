import { createFileRoute } from '@tanstack/react-router'

import { PageIntro } from '@/components/page-intro'
import { cacheHeaders } from '@/lib/cache-control'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'About us | Marquee Insights' }] }),
  headers: () => cacheHeaders('content'),
  component: AboutPage,
})

function AboutPage() {
  return (
    <PageIntro title="About us">
      <p>Marquee Insights studies how people choose what to watch and why they keep watching.</p>
    </PageIntro>
  )
}
