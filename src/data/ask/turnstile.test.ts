import { describe, expect, it, vi } from 'vitest'

import { createTurnstileVerifier } from './turnstile'

describe('createTurnstileVerifier', () => {
  it('posts the token and ip and trusts only success: true', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ success: true }))
    const verify = createTurnstileVerifier('secret', fetchImpl as unknown as typeof fetch)
    expect(await verify('token', '203.0.113.9')).toBe(true)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('challenges.cloudflare.com')
    expect(String(init.body)).toBe('secret=secret&response=token&remoteip=203.0.113.9')
  })

  it('fails without a token, without a secret, on a failure response and on a network error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const failing = vi.fn(async () => Response.json({ success: false }))
    expect(await createTurnstileVerifier('secret', failing as unknown as typeof fetch)('token', null)).toBe(false)
    expect(await createTurnstileVerifier('secret', failing as unknown as typeof fetch)(undefined, null)).toBe(false)
    expect(await createTurnstileVerifier(undefined, failing as unknown as typeof fetch)('token', null)).toBe(false)
    const broken = vi.fn(async () => {
      throw new Error('offline')
    })
    expect(await createTurnstileVerifier('secret', broken as unknown as typeof fetch)('token', null)).toBe(false)
  })
})
