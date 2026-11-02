import { getCookie } from '@tanstack/react-start/server'

import { PREVIEW_COOKIE, verifyPreviewToken } from '@/lib/preview-session'
import { serverSecret } from '@/lib/server-env'

export async function isPreviewEnabled(): Promise<boolean> {
  const secret = serverSecret('SANITY_PREVIEW_SECRET')
  if (!secret || !serverSecret('SANITY_READ_TOKEN')) return false
  return verifyPreviewToken(secret, getCookie(PREVIEW_COOKIE))
}
