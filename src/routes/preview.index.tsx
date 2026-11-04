import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/components/home-page'
import { loadHome } from '@/content'
import { homeHead } from '@/lib/document-heads'

export const Route = createFileRoute('/preview/')({
  loader: () => loadHome({ preview: true }),
  head: ({ loaderData, match }) =>
    homeHead(match.context.siteSettings, loaderData?.page, { preview: true }),
  component: PreviewHomeRoute,
})

function PreviewHomeRoute() {
  return <HomePage {...Route.useLoaderData()} />
}
