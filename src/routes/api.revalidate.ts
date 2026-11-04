import { createFileRoute } from '@tanstack/react-router'

import { getContentKv } from '@/lib/edge/workers-store'
import { handlePublish } from '@/lib/publish'
import { serverSecret } from '@/lib/server-env'

// Called by the Sanity webhook on publish, unpublish and delete.
export const Route = createFileRoute('/api/revalidate')({
  server: {
    handlers: {
      GET: () => Response.json({ message: 'Sanity calls this endpoint with POST.' }, { status: 405 }),
      POST: ({ request }) =>
        handlePublish(request, { secret: serverSecret('SANITY_WEBHOOK_SECRET'), kv: getContentKv() }),
    },
  },
})
