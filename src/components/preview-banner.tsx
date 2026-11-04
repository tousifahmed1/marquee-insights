import { useLocation } from '@tanstack/react-router'
import { Eye } from 'lucide-react'

import { Container } from '@/components/container'
import { toPublishedPath } from '@/lib/preview-session'

export function PreviewBanner() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const exitHref = `/api/preview/exit?path=${encodeURIComponent(toPublishedPath(pathname))}`
  return (
    <aside
      aria-label="Preview mode"
      className="sticky top-16 z-30 border-b border-primary bg-primary text-primary-foreground"
    >
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Eye aria-hidden className="size-4" />
          Preview mode: you are seeing draft content that is not published yet.
        </p>
        <a href={exitHref} className="font-semibold underline underline-offset-4 hover:decoration-2 focus-visible:outline-primary-foreground">
          Exit preview
        </a>
      </Container>
    </aside>
  )
}
