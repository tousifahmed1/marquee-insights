import { createFileRoute, notFound } from '@tanstack/react-router'

import { ReportArticle } from '@/components/reports/report-article'
import { getReport } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'
import { articleJsonLd } from '@/lib/structured-data'

export const Route = createFileRoute('/reports/$slug')({
  loader: async ({ params }) => {
    const report = await getReport({ data: { slug: params.slug } })
    if (!report) throw notFound()
    return report
  },
  head: ({ loaderData, match }) => {
    const settings = match.context.siteSettings
    const head = seoHead(
      resolveSeo(settings, {
        seo: loaderData?.seo,
        title: loaderData?.title,
        description: loaderData?.excerpt,
        image: loaderData?.coverImage,
        path: loaderData ? `/reports/${loaderData.slug}` : null,
        type: 'article',
        publishedAt: loaderData?.publishedAt,
        modifiedAt: loaderData?.updatedAt,
      }),
    )
    return {
      ...head,
      meta: loaderData ? [...head.meta, articleJsonLd(loaderData, settings)] : head.meta,
    }
  },
  headers: () => cacheHeaders('content'),
  component: ReportPage,
})

function ReportPage() {
  return <ReportArticle report={Route.useLoaderData()} />
}
