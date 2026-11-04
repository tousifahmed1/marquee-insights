import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/components/home-page'
import { loadHome } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { homeHead } from '@/lib/document-heads'

export const Route = createFileRoute('/')({
  loader: () => loadHome({ preview: false }),
  head: ({ loaderData, match }) =>
    homeHead(match.context.siteSettings, loaderData?.page, { preview: false }),
  headers: () => cacheHeaders('content'),
  component: HomeRoute,
})

function HomeRoute() {
  return <HomePage {...Route.useLoaderData()} />
}
