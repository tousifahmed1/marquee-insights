import { createMiddleware, createStart } from '@tanstack/react-start'

import { applyDefaultCachePolicy } from '@/lib/cache-control'

const cachePolicyMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next()
  applyDefaultCachePolicy(result.response.headers, result.response.status)
  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [cachePolicyMiddleware],
}))
