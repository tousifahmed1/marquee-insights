import { expect, test } from '@playwright/test'

import { CACHE_POLICIES } from '../src/lib/cache-control'
import { signSanityPayload } from '../src/lib/sanity-webhook'

const secret = process.env.SANITY_WEBHOOK_SECRET ?? ''
const body = JSON.stringify({
  _id: 'e2e-report',
  _type: 'report',
  operation: 'update',
  slug: 'e2e-report',
  previousSlug: 'e2e-report',
})

test.beforeAll(() => {
  expect(secret, 'Set SANITY_WEBHOOK_SECRET in .env to test the publish webhook').not.toBe('')
})

test('the publish webhook rejects unsigned and forged calls', async ({ request }) => {
  for (const signature of [undefined, 't=1,v1=forged', await signSanityPayload(body, 'wrong', 1)]) {
    const response = await request.post('/api/revalidate', {
      data: body,
      headers: { 'content-type': 'application/json', ...(signature ? { 'sanity-webhook-signature': signature } : {}) },
    })
    expect(response.status()).toBe(401)
    expect(response.headers()['cache-control']).toBe(CACHE_POLICIES.noStore['Cache-Control'])
  }
})

test('a signed publish bumps the content version and reports the affected URLs', async ({
  request,
}) => {
  const publish = async () => {
    const response = await request.post('/api/revalidate', {
      data: body,
      headers: {
        'content-type': 'application/json',
        'sanity-webhook-signature': await signSanityPayload(body, secret, Date.now()),
      },
    })
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toBe(CACHE_POLICIES.noStore['Cache-Control'])
    return (await response.json()) as { contentVersion: string; urls: string[] }
  }

  const first = await publish()
  expect(first.urls).toEqual(['/', '/reports', '/reports/e2e-report'])
  await new Promise((resolve) => setTimeout(resolve, 5))
  const second = await publish()
  expect(Number(second.contentVersion)).toBeGreaterThan(Number(first.contentVersion))
})
