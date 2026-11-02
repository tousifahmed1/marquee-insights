import { getCookie } from '@tanstack/react-start/server'

import { PREVIEW_COOKIE, verifyPreviewToken } from '@/lib/preview-session'

export async function isPreviewEnabled(): Promise<boolean> {
  const secret = process.env.SANITY_PREVIEW_SECRET
  if (!secret || !process.env.SANITY_READ_TOKEN) return false
  return verifyPreviewToken(secret, getCookie(PREVIEW_COOKIE))
}
