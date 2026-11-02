import { createFileRoute, notFound } from '@tanstack/react-router'

import { ContentPage } from '@/components/content-page'
import { getPage } from '@/content'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/preview/')({
  loader: async () => {
    const page = await getPage({ data: { slug: 'home', preview: true } })
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData, match }) =>
    seoHead(resolveSeo(match.context.siteSettings, { seo: loaderData?.seo })),
  component: PreviewHomePage,
})

function PreviewHomePage() {
  return <ContentPage page={Route.useLoaderData()} />
}
