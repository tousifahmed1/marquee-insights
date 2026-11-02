import { createFileRoute } from '@tanstack/react-router'

import { fetchSitemapEntries } from '@/content/routing'
import { cacheHeaders } from '@/lib/cache-control'
import { buildSitemapXml } from '@/lib/sitemap'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () =>
        new Response(buildSitemapXml(await fetchSitemapEntries()), {
          headers: { 'Content-Type': 'application/xml; charset=utf-8', ...cacheHeaders('content') },
        }),
    },
  },
})
