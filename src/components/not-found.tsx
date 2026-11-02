import { Link } from '@tanstack/react-router'

import { PageIntro } from '@/components/page-intro'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <PageIntro title="Page not found">
      <p>
        This page doesn’t exist or has moved. Check the address, or start again
        from the home page.
      </p>
      <Button size="lg" className="mt-8" asChild>
        <Link to="/">Go to the home page</Link>
      </Button>
    </PageIntro>
  )
}
