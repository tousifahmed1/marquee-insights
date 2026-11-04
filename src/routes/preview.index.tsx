import { createFileRoute, notFound } from '@tanstack/react-router'

import { ContentPage } from '@/components/content-page'
import { NowShowing } from '@/components/reports/now-showing'
import { getLatestReport, getPage } from '@/content'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/preview/')({
  loader: async () => {
    const [page, latest] = await Promise.all([
      getPage({ data: { slug: 'home', preview: true } }),
      getLatestReport(),
    ])
    if (!page) throw notFound()
    return { page, latest }
  },
  head: ({ loaderData, match }) =>
    seoHead(resolveSeo(match.context.siteSettings, { seo: loaderData?.page.seo })),
  component: PreviewHomePage,
})

function PreviewHomePage() {
  const { page, latest } = Route.useLoaderData()
  return <ContentPage page={page} heroAside={latest ? <NowShowing report={latest} /> : null} />
}
