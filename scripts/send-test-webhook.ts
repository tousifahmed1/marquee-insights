import { existsSync } from 'node:fs'

import { signSanityPayload } from '../src/lib/sanity-webhook'

if (existsSync('.env')) process.loadEnvFile('.env')

const [baseUrl = 'http://localhost:3000', type = 'report', slug = 'the-second-season-slump'] =
  process.argv.slice(2)

async function main() {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) throw new Error('Set SANITY_WEBHOOK_SECRET in .env')

  const body = JSON.stringify({
    _id: `test-${type}`,
    _type: type,
    operation: 'update',
    slug,
    previousSlug: slug,
  })
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/revalidate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'sanity-webhook-signature': await signSanityPayload(body, secret, Date.now()),
    },
    body,
  })
  console.log(response.status, JSON.stringify(await response.json(), null, 2))
  process.exitCode = response.ok ? 0 : 1
}

void main()
