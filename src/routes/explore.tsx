import { createFileRoute } from '@tanstack/react-router'

import { PageIntro } from '@/components/page-intro'

export const Route = createFileRoute('/explore')({
  head: () => ({ meta: [{ title: 'Explore the data | Marquee Insights' }] }),
  component: ExplorePage,
})

function ExplorePage() {
  return (
    <PageIntro title="Explore the data">
      <p>Filter and compare results from the weekly viewing panel. The data explorer is coming next.</p>
    </PageIntro>
  )
}
