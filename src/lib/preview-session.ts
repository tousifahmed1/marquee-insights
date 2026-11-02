export const PREVIEW_COOKIE = 'marquee_preview'
export const PREVIEW_MAX_AGE_SECONDS = 60 * 60 * 8

const encoder = new TextEncoder()

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function signingKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

const payload = (expires: number) => encoder.encode(`preview:${expires}`)

export async function createPreviewToken(secret: string, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + PREVIEW_MAX_AGE_SECONDS
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), payload(expires))
  return `${expires}.${toBase64Url(signature)}`
}

export async function verifyPreviewToken(
  secret: string,
  token: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  const [expiresPart, signaturePart, ...rest] = token?.split('.') ?? []
  if (!expiresPart || !signaturePart || rest.length > 0 || !/^\d+$/.test(expiresPart)) return false
  const expires = Number(expiresPart)
  if (expires <= Math.floor(now / 1000)) return false
  const signature = fromBase64Url(signaturePart)
  if (!signature) return false
  return crypto.subtle.verify('HMAC', await signingKey(secret), signature, payload(expires))
}

export async function secretsMatch(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all(
    [given, expected].map((value) => crypto.subtle.digest('SHA-256', encoder.encode(value))),
  )
  const left = new Uint8Array(a)
  const right = new Uint8Array(b)
  let difference = 0
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index]
  return difference === 0 && expected.length > 0
}

export const PREVIEW_PREFIX = '/preview'

const SAFE_PATH = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/

export function isSafePreviewPath(path: string): boolean {
  return SAFE_PATH.test(path)
}

export function toPreviewPath(path: string): string {
  return path === '/' ? PREVIEW_PREFIX : `${PREVIEW_PREFIX}${path}`
}

export function toPublishedPath(previewPath: string): string {
  if (previewPath === PREVIEW_PREFIX || previewPath === `${PREVIEW_PREFIX}/`) return '/'
  return previewPath.startsWith(`${PREVIEW_PREFIX}/`)
    ? previewPath.slice(PREVIEW_PREFIX.length)
    : '/'
}

export function isPreviewUrlPath(pathname: string): boolean {
  return [PREVIEW_PREFIX, '/api/preview'].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function previewCookie(token: string, maxAge = PREVIEW_MAX_AGE_SECONDS): string {
  return `${PREVIEW_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}
