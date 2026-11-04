import { describe, expect, it, vi } from 'vitest'

import { CONTENT_VERSION_KEY, createMemoryKv } from '@/lib/edge'

import { handlePublish } from './publish'
import { signSanityPayload } from './sanity-webhook'

const SECRET = 'webhook-secret'
const NOW = 1_793_620_000_000
const REPORT = JSON.stringify({ _id: 'report-1', _type: 'report', slug: 'the-second-season-slump' })

async function publish(body: string, { signature, secret = SECRET }: { signature?: string | null; secret?: string } = {}) {
  const kv = createMemoryKv()
  const header = signature === undefined ? await signSanityPayload(body, SECRET, NOW) : signature
  const request = new Request('https://marquee.test/api/revalidate', {
    method: 'POST',
    body,
    headers: header === null ? {} : { 'sanity-webhook-signature': header },
  })
  const response = await handlePublish(request, { secret, kv, now: () => NOW })
  return { response, version: await kv.get(CONTENT_VERSION_KEY) }
}

describe('handlePublish', () => {
  it('bumps the content version to the publish time and lists the affected URLs', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const { response, version } = await publish(REPORT)
    expect(response.status).toBe(200)
    expect(version).toBe(String(NOW))
    expect(await response.json()).toMatchObject({
      revalidated: true,
      contentVersion: String(NOW),
      urls: ['/', '/reports', '/reports/the-second-season-slump', '/sitemap.xml'],
    })
  })

  it.each([
    ['an unsigned call', REPORT, null, 401],
    ['a forged signature', REPORT, 't=1,v1=forged', 401],
    ['a body that is not JSON', 'not json', undefined, 400],
    ['a payload without _id and _type', '{"slug":"x"}', undefined, 400],
    ['an oversized payload', 'x'.repeat(64 * 1024 + 1), undefined, 413],
  ] as const)('rejects %s without touching the cache', async (_name, body, signature, status) => {
    const { response, version } = await publish(body, { signature })
    expect(response.status).toBe(status)
    expect(version).toBeNull()
  })

  it('refuses to run without a secret or KV', async () => {
    const request = () => new Request('https://marquee.test/api/revalidate', { method: 'POST', body: REPORT })
    expect((await handlePublish(request(), { secret: '', kv: createMemoryKv() })).status).toBe(500)
    expect((await handlePublish(request(), { secret: SECRET, kv: null })).status).toBe(500)
  })
})
