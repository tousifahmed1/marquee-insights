import { createFileRoute } from '@tanstack/react-router'

import { cacheHeaders } from '@/lib/cache-control'
import { buildRobotsTxt } from '@/lib/sitemap'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildRobotsTxt(), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', ...cacheHeaders('content') },
        }),
    },
  },
})
