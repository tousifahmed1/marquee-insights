// Cloudflare Turnstile: the form gets a token from the widget, the server
// checks it here before any model call. Cached answers and the example
// questions never need one. Without a secret, verification fails closed.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Cloudflare's always-passing test keys, for development and e2e.
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA'

export type VerifyTurnstile = (token: string | undefined, ip: string | null) => Promise<boolean>

export function createTurnstileVerifier(
  secret: string | undefined,
  fetchImpl: typeof fetch = fetch,
): VerifyTurnstile {
  return async (token, ip) => {
    if (!secret) {
      console.error('[ask] TURNSTILE_SECRET_KEY is not set; refusing uncached questions')
      return false
    }
    if (!token) return false
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)
    try {
      const response = await fetchImpl(VERIFY_URL, { method: 'POST', body })
      const result: unknown = await response.json()
      return (
        typeof result === 'object' && result !== null && 'success' in result && result.success === true
      )
    } catch (error) {
      console.error('[ask] Turnstile verification failed', error)
      return false
    }
  }
}
