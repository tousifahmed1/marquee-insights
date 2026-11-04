import { createFileRoute } from '@tanstack/react-router'

import { EXAMPLE_QUESTIONS } from '@/data/ask/examples'
import { ask } from '@/data/ask/pipeline'
import { askDeps, getAnswerCache, isAdminRequest } from '@/data/ask/server'

// Pre-warms the example questions so the buttons on /ask always answer from
// the cache. pnpm warm:ask calls it after a deploy; with { "reset": true }
// it first bumps the data version, which is what a reseed needs.
export const Route = createFileRoute('/api/ask/warm')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminRequest(request))) {
          return Response.json({ message: 'Unauthorized.' }, { status: 401 })
        }
        const body: unknown = await request.json().catch(() => ({}))
        const reset = typeof body === 'object' && body !== null && 'reset' in body && body.reset === true
        const cache = getAnswerCache()
        if (reset) await cache.resetDataVersion()

        const results = []
        for (const question of EXAMPLE_QUESTIONS) {
          const outcome = await ask(question, askDeps())
          results.push({
            question,
            status: outcome.status,
            cached: 'cached' in outcome ? outcome.cached : false,
            modelCalls: outcome.modelCalls,
            ms: outcome.timings.total,
          })
        }
        return Response.json({ dataVersion: await cache.dataVersion(), reset, results })
      },
    },
  },
})
