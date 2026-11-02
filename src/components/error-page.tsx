import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

import { StatusPage } from '@/components/status-page'
import { Button } from '@/components/ui/button'

const LIT = [false, false, false, false, false, false, false]

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const retry = () => {
    reset()
    void router.invalidate()
  }
  return (
    <StatusPage
      code="Error"
      title="Something went wrong"
      lit={LIT}
      actions={
        <>
          <Button size="lg" onClick={retry}>
            Try again
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/">Go to the home page</Link>
          </Button>
        </>
      }
    >
      <p role="alert">
        This page didn’t load. It’s usually a short outage on our side, so try again in a moment.
      </p>
      {import.meta.env.DEV && error instanceof Error ? (
        <pre className="mt-6 overflow-auto rounded-md bg-muted p-4 text-sm">{error.message}</pre>
      ) : null}
    </StatusPage>
  )
}
