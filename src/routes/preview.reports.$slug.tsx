import { createFileRoute } from '@tanstack/react-router'

import { ReportArticle } from '@/components/reports/report-article'
import { loadReport } from '@/content'
import { reportHead } from '@/lib/document-heads'

export const Route = createFileRoute('/preview/reports/$slug')({
  loader: ({ params }) => loadReport(params.slug, { preview: true }),
  head: ({ loaderData, match }) => reportHead(match.context.siteSettings, loaderData, { preview: true }),
  component: PreviewReportPage,
})

function PreviewReportPage() {
  return <ReportArticle report={Route.useLoaderData()} />
}
