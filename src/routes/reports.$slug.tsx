import { createFileRoute } from '@tanstack/react-router'

import { ReportArticle } from '@/components/reports/report-article'
import { loadReport } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { reportHead } from '@/lib/document-heads'

export const Route = createFileRoute('/reports/$slug')({
  loader: ({ params }) => loadReport(params.slug, { preview: false }),
  head: ({ loaderData, match }) => reportHead(match.context.siteSettings, loaderData, { preview: false }),
  headers: () => cacheHeaders('content'),
  component: ReportPage,
})

function ReportPage() {
  return <ReportArticle report={Route.useLoaderData()} />
}
