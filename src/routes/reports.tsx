import { createFileRoute } from '@tanstack/react-router'

import { PageIntro } from '@/components/page-intro'

export const Route = createFileRoute('/reports')({
  head: () => ({ meta: [{ title: 'Reports | Marquee Insights' }] }),
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <PageIntro title="Reports">
      <p>Published research on viewing habits, release strategy and audience loyalty. Reports will appear here once the CMS is connected.</p>
    </PageIntro>
  )
}
