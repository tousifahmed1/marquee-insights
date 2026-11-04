import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

import { fetchRedirects } from '@/content/routing'
import { handleEdgeRequest } from '@/lib/edge'
import { getEdgeStore } from '@/lib/edge/workers-store'

export default createServerEntry({
  fetch: (request, opts) =>
    handleEdgeRequest(request, {
      render: async () => handler.fetch(request, opts),
      fetchRedirects,
      store: getEdgeStore(),
    }),
})
