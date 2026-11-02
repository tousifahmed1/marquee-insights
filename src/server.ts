import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

import { fetchRedirects } from '@/content/routing'
import { servePage } from '@/lib/page-cache'
import { getPageCache } from '@/lib/page-cache-store'
import { serveRedirect } from '@/lib/redirects'

export default createServerEntry({
  async fetch(request, opts) {
    const cache = getPageCache()
    const redirect = await serveRedirect(request, cache, fetchRedirects)
    if (redirect) return redirect
    return servePage(request, async () => handler.fetch(request, opts), cache)
  },
})
