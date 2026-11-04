import { createFileRoute } from '@tanstack/react-router'

import { bumpContentVersion } from '@/lib/edge'
import { getContentKv } from '@/lib/edge/workers-store'
import { affectedUrls, parsePublishedDocument } from '@/lib/purge-map'
import { isValidSanitySignature } from '@/lib/sanity-webhook'
import { serverSecret } from '@/lib/server-env'

const MAX_BODY_BYTES = 64 * 1024

const json = (body: unknown, status: number) => Response.json(body, { status })

// Called by the Sanity webhook on publish, unpublish and delete. Bumps the
// content version so every cached page is rendered again on its next request.
export const Route = createFileRoute('/api/revalidate')({
  server: {
    handlers: {
      GET: () => json({ message: 'Sanity calls this endpoint with POST.' }, 405),
      POST: async ({ request }) => {
        const secret = serverSecret('SANITY_WEBHOOK_SECRET')
        const kv = getContentKv()
        if (!secret || !kv) {
          return json({ message: 'Revalidation is not configured on this server.' }, 500)
        }

        const body = await request.text()
        if (body.length > MAX_BODY_BYTES) {
          return json({ message: 'Payload too large.' }, 413)
        }
        const signature = request.headers.get('sanity-webhook-signature')
        if (!(await isValidSanitySignature(body, signature, secret))) {
          return json({ message: 'Invalid signature.' }, 401)
        }

        let payload: unknown
        try {
          payload = JSON.parse(body)
        } catch {
          return json({ message: 'Body is not JSON.' }, 400)
        }
        const document = parsePublishedDocument(payload)
        if (!document) {
          return json({ message: 'Payload needs _id and _type.' }, 400)
        }

        const urls = affectedUrls(document)
        const version = await bumpContentVersion(kv)
        console.log(
          JSON.stringify({ event: 'content-published', ...document, urls, contentVersion: version }),
        )
        return json({ revalidated: true, contentVersion: version, document, urls }, 200)
      },
    },
  },
})
