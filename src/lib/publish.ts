import { bumpContentVersion } from '@/lib/edge'
import type { EdgeKv } from '@/lib/edge'

import { affectedUrls, parsePublishedDocument } from './purge-map'
import { isValidSanitySignature } from './sanity-webhook'

const MAX_BODY_BYTES = 64 * 1024

type PublishDeps = {
  secret: string | null | undefined
  kv: Pick<EdgeKv, 'put'> | null
  now?: () => number
}

const json = (body: unknown, status: number) => Response.json(body, { status })

// A Sanity publish, unpublish or delete. Checks the signature, then bumps the
// content version so every cached page is rendered again on its next request.
export async function handlePublish(
  request: Request,
  { secret, kv, now = Date.now }: PublishDeps,
): Promise<Response> {
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
  const version = await bumpContentVersion(kv, now())
  console.log(JSON.stringify({ event: 'content-published', ...document, urls, contentVersion: version }))
  return json({ revalidated: true, contentVersion: version, document, urls }, 200)
}
