import { createFileRoute } from '@tanstack/react-router'

import { getBudget, isAdminRequest } from '@/data/ask/server'

// Today's model calls per provider, cache hits and misses, and the remaining
// budget. Admin only: send ASK_ADMIN_SECRET in the x-ask-admin header.
export const Route = createFileRoute('/api/ask/status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdminRequest(request))) {
          return Response.json({ message: 'Unauthorized.' }, { status: 401 })
        }
        return Response.json(await getBudget().status())
      },
    },
  },
})
