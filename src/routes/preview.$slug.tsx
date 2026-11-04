import { createFileRoute } from '@tanstack/react-router'

import { ContentPage } from '@/components/content-page'
import { loadPage } from '@/content'
import { pageHead } from '@/lib/document-heads'

export const Route = createFileRoute('/preview/$slug')({
  loader: ({ params }) => loadPage(params.slug, { preview: true }),
  head: ({ loaderData, match }) => pageHead(match.context.siteSettings, loaderData, { preview: true }),
  component: PreviewSlugPage,
})

function PreviewSlugPage() {
  return <ContentPage page={Route.useLoaderData()} />
}
