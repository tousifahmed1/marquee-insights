import { createFileRoute } from '@tanstack/react-router'

import { ContentPage } from '@/components/content-page'
import { loadPage } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { pageHead } from '@/lib/document-heads'

export const Route = createFileRoute('/$slug')({
  loader: ({ params }) => loadPage(params.slug, { preview: false }),
  head: ({ loaderData, match }) => pageHead(match.context.siteSettings, loaderData, { preview: false }),
  headers: () => cacheHeaders('content'),
  component: SlugPage,
})

function SlugPage() {
  return <ContentPage page={Route.useLoaderData()} />
}
