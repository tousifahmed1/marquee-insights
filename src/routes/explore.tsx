import { createFileRoute } from '@tanstack/react-router'

import { PageIntro } from '@/components/page-intro'
import { cacheHeaders } from '@/lib/cache-control'

export const Route = createFileRoute('/explore')({
  head: () => ({ meta: [{ title: 'Explore the data | Marquee Insights' }] }),
  headers: () => cacheHeaders('content'),
  component: ExplorePage,
})

function ExplorePage() {
  return (
    <PageIntro title="Explore the data">
      <p>Filter and compare results from the weekly viewing panel. The data explorer is coming next.</p>
    </PageIntro>
  )
}
