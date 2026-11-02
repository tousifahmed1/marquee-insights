import { createFileRoute, notFound } from '@tanstack/react-router'

import { ReportArticle } from '@/components/reports/report-article'
import { getReport } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/reports/$slug')({
  loader: async ({ params }) => {
    const report = await getReport({ data: { slug: params.slug } })
    if (!report) throw notFound()
    return report
  },
  head: ({ loaderData, match }) =>
    seoHead(
      resolveSeo(match.context.siteSettings, {
        seo: loaderData?.seo,
        title: loaderData?.title,
        description: loaderData?.excerpt,
        image: loaderData?.coverImage,
      }),
    ),
  headers: () => cacheHeaders('content'),
  component: ReportPage,
})

function ReportPage() {
  return <ReportArticle report={Route.useLoaderData()} />
}
