import { createFileRoute, notFound } from '@tanstack/react-router'

import { ContentPage } from '@/components/content-page'
import { getPage } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/$slug')({
  loader: async ({ params }) => {
    if (params.slug === 'home') throw notFound()
    const page = await getPage({ data: { slug: params.slug } })
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData, match }) =>
    seoHead(
      resolveSeo(match.context.siteSettings, {
        seo: loaderData?.seo,
        title: loaderData?.title,
        path: loaderData ? `/${loaderData.slug}` : null,
      }),
    ),
  headers: () => cacheHeaders('content'),
  component: SlugPage,
})

function SlugPage() {
  return <ContentPage page={Route.useLoaderData()} />
}
