import { createFileRoute } from '@tanstack/react-router'

import {
  createPreviewToken,
  isSafePreviewPath,
  previewCookie,
  secretsMatch,
  toPreviewPath,
} from '@/lib/preview-session'
import { serverSecret } from '@/lib/server-env'

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

export const Route = createFileRoute('/api/preview/enable')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = serverSecret('SANITY_PREVIEW_SECRET')
        if (!secret || !serverSecret('SANITY_READ_TOKEN')) {
          return text('Preview is not configured on this server.', 500)
        }
        const params = new URL(request.url).searchParams
        if (!(await secretsMatch(params.get('secret') ?? '', secret))) {
          return text('The preview secret is missing or wrong.', 401)
        }
        const path = params.get('path') ?? '/'
        if (!isSafePreviewPath(path)) {
          return text('Use a site path like /about or /reports/report-slug.', 400)
        }
        return new Response(null, {
          status: 307,
          headers: {
            Location: toPreviewPath(path),
            'Set-Cookie': previewCookie(await createPreviewToken(secret)),
          },
        })
      },
    },
  },
})
