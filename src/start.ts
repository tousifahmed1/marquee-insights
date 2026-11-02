import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'

import { applyDefaultCachePolicy } from '@/lib/cache-control'

const cachePolicyMiddleware = createMiddleware().server(async ({ next, request }) => {
  const result = await next()
  applyDefaultCachePolicy(
    result.response.headers,
    result.response.status,
    new URL(request.url).pathname,
  )
  return result
})

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [cachePolicyMiddleware, csrfMiddleware],
}))
