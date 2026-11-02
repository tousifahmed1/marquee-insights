import { createFileRoute } from '@tanstack/react-router'

import { PageIntro } from '@/components/page-intro'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'About us | Marquee Insights' }] }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <PageIntro title="About us">
      <p>Marquee Insights studies how people choose what to watch and why they keep watching.</p>
    </PageIntro>
  )
}
