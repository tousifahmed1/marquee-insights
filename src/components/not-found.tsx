import { Link } from '@tanstack/react-router'

import { StatusPage } from '@/components/status-page'
import { Button } from '@/components/ui/button'

const LIT = [true, true, false, true, true, false, true]

export function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      lit={LIT}
      actions={
        <>
          <Button size="lg" asChild>
            <Link to="/">Go to the home page</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/reports">Browse reports</Link>
          </Button>
        </>
      }
    >
      <p>
        This page doesn’t exist or has moved. Check the address, or start again from the home page.
      </p>
    </StatusPage>
  )
}
