import { describe, expect, it } from 'vitest'

import {
  PREVIEW_MAX_AGE_SECONDS,
  createPreviewToken,
  isSafePreviewPath,
  secretsMatch,
  toPreviewPath,
  toPublishedPath,
  verifyPreviewToken,
} from './preview-session'

const SECRET = 'test-secret'
const NOW = Date.UTC(2026, 10, 2, 12)

describe('preview tokens', () => {
  it('accepts a token it signed', async () => {
    const token = await createPreviewToken(SECRET, NOW)
    expect(await verifyPreviewToken(SECRET, token, NOW)).toBe(true)
  })

  it('rejects a token signed with another secret', async () => {
    const token = await createPreviewToken('other-secret', NOW)
    expect(await verifyPreviewToken(SECRET, token, NOW)).toBe(false)
  })

  it('rejects an expired token', async () => {
    const token = await createPreviewToken(SECRET, NOW)
    const later = NOW + (PREVIEW_MAX_AGE_SECONDS + 1) * 1000
    expect(await verifyPreviewToken(SECRET, token, later)).toBe(false)
  })

  it('rejects a token whose expiry was extended', async () => {
    const [expires, signature] = (await createPreviewToken(SECRET, NOW)).split('.')
    const forged = `${Number(expires) + 86_400}.${signature}`
    expect(await verifyPreviewToken(SECRET, forged, NOW)).toBe(false)
  })

  it.each([undefined, '', 'abc', '123', '123.', '.sig', '99999999999.not*base64', 'a.b.c'])(
    'rejects malformed token %j',
    async (token) => {
      expect(await verifyPreviewToken(SECRET, token, NOW)).toBe(false)
    },
  )
})

describe('secretsMatch', () => {
  it('matches only the exact secret', async () => {
    expect(await secretsMatch(SECRET, SECRET)).toBe(true)
    expect(await secretsMatch('test-secreT', SECRET)).toBe(false)
    expect(await secretsMatch('', SECRET)).toBe(false)
  })

  it('never matches when no secret is configured', async () => {
    expect(await secretsMatch('', '')).toBe(false)
  })
})

describe('preview paths', () => {
  it.each(['/', '/about', '/reports/the-second-season-slump'])('allows %s', (path) => {
    expect(isSafePreviewPath(path)).toBe(true)
  })

  it.each(['', 'about', '//evil.example', '/about?x=1', '/../etc', '/About', 'https://x.example'])(
    'rejects %j',
    (path) => {
      expect(isSafePreviewPath(path)).toBe(false)
    },
  )

  it('maps published paths to preview paths and back', () => {
    expect(toPreviewPath('/')).toBe('/preview')
    expect(toPreviewPath('/reports/a')).toBe('/preview/reports/a')
    expect(toPublishedPath('/preview')).toBe('/')
    expect(toPublishedPath('/preview/reports/a')).toBe('/reports/a')
    expect(toPublishedPath('/previewer')).toBe('/')
  })
})
