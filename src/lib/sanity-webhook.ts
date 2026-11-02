import { secretsMatch } from './preview-session'

const encoder = new TextEncoder()

function base64Url(bytes: ArrayBuffer): string {
  let binary = ''
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function signSanityPayload(
  body: string,
  secret: string,
  timestamp: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`))
  return `t=${timestamp},v1=${base64Url(signature)}`
}

// Checks the sanity-webhook-signature header ("t=<ms>,v1=<base64url HMAC>")
// against the raw request body. The body must not be parsed first.
export async function isValidSanitySignature(
  body: string,
  header: string | null,
  secret: string,
): Promise<boolean> {
  const match = /^t=(\d+),v1=([\w-]+)$/.exec(header?.trim() ?? '')
  if (!match || secret === '') return false
  const expected = await signSanityPayload(body, secret, Number(match[1]))
  return secretsMatch(header?.trim() ?? '', expected)
}
