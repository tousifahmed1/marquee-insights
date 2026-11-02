import { createFileRoute } from '@tanstack/react-router'

import { isSafePreviewPath, previewCookie } from '@/lib/preview-session'

export const Route = createFileRoute('/api/preview/exit')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const path = new URL(request.url).searchParams.get('path') ?? '/'
        return new Response(null, {
          status: 307,
          headers: {
            Location: isSafePreviewPath(path) ? path : '/',
            'Set-Cookie': previewCookie('', 0),
          },
        })
      },
    },
  },
})
