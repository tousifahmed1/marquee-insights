import { createFileRoute, notFound } from '@tanstack/react-router'

import { ContentPage } from '@/components/content-page'
import { getPage } from '@/content'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/preview/$slug')({
  loader: async ({ params }) => {
    if (params.slug === 'home') throw notFound()
    const page = await getPage({ data: { slug: params.slug, preview: true } })
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData, match }) =>
    seoHead(
      resolveSeo(match.context.siteSettings, { seo: loaderData?.seo, title: loaderData?.title }),
    ),
  component: PreviewSlugPage,
})

function PreviewSlugPage() {
  return <ContentPage page={Route.useLoaderData()} />
}
