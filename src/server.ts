import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

import { servePage } from '@/lib/page-cache'
import { getPageCache } from '@/lib/page-cache-store'

export default createServerEntry({
  fetch(request, opts) {
    return servePage(request, async () => handler.fetch(request, opts), getPageCache())
  },
})
