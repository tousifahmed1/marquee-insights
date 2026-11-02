import { describe, expect, it } from 'vitest'

import { isValidSanitySignature, signSanityPayload } from './sanity-webhook'

const SECRET = 'webhook-secret'
const BODY = '{"_id":"report-1","_type":"report","slug":"the-second-season-slump"}'

describe('isValidSanitySignature', () => {
  it('accepts a payload signed with the secret', async () => {
    const header = await signSanityPayload(BODY, SECRET, 1_793_620_000_000)
    expect(header).toMatch(/^t=1793620000000,v1=[\w-]+$/)
    await expect(isValidSanitySignature(BODY, header, SECRET)).resolves.toBe(true)
  })

  it('matches the HMAC-SHA256 of "<timestamp>.<body>" in base64url (checked with openssl)', async () => {
    const header = await signSanityPayload('{}', 'secret', 1)
    expect(header).toBe('t=1,v1=ESJ2exkxEM_sMitvGZtZntv2CO0Ify0nr7C5fZlSOQg')
  })

  type Case = [string, () => Promise<[string, string | null]>]

  it.each<Case>([
    ['a different secret', async () => [BODY, await signSanityPayload(BODY, 'other', 1)]],
    ['a changed body', async () => [`${BODY} `, await signSanityPayload(BODY, SECRET, 1)]],
    [
      'a changed timestamp',
      async () => [BODY, (await signSanityPayload(BODY, SECRET, 1)).replace('t=1,', 't=2,')],
    ],
    ['no header', async () => [BODY, null]],
    ['a malformed header', async () => [BODY, 'v1=abc']],
  ])('rejects %s', async (_name, build) => {
    const [body, header] = await build()
    await expect(isValidSanitySignature(body, header, SECRET)).resolves.toBe(false)
  })

  it('rejects everything when the secret is empty', async () => {
    const header = await signSanityPayload(BODY, SECRET, 1)
    await expect(isValidSanitySignature(BODY, header, '')).resolves.toBe(false)
  })
})
