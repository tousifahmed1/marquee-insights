import { createFileRoute, notFound } from '@tanstack/react-router'

import { ContentPage } from '@/components/content-page'
import { getPage } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/')({
  loader: async () => {
    const page = await getPage({ data: { slug: 'home' } })
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData, match }) =>
    seoHead(resolveSeo(match.context.siteSettings, { seo: loaderData?.seo })),
  headers: () => cacheHeaders('content'),
  component: HomePage,
})

function HomePage() {
  return <ContentPage page={Route.useLoaderData()} />
}
