import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'

import { PreviewBanner } from '@/components/preview-banner'
import { getPreviewStatus } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'

export const Route = createFileRoute('/preview')({
  beforeLoad: async () => {
    if (!(await getPreviewStatus())) throw notFound()
  },
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
  headers: () => cacheHeaders('noStore'),
  component: PreviewLayout,
})

function PreviewLayout() {
  return (
    <>
      <PreviewBanner />
      <Outlet />
    </>
  )
}
