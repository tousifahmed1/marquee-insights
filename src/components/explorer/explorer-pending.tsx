import { Container } from '@/components/container'
import { Section } from '@/components/section'

export function ExplorerIntro() {
  return (
    <>
      <h1 className="text-5xl">Audience explorer</h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">
        50,000 survey responses from the last 12 monthly waves. Filter by show, audience and month,
        and every view gets its own link.
      </p>
    </>
  )
}

const FILTERS = ['show', 'platform', 'genre', 'region', 'age', 'wave'] as const

// Shown on client-side navigation while the first data loads, laid out like
// the explorer so nothing moves when it arrives. The server never renders it.
export function ExplorerPending() {
  return (
    <Section className="pt-12">
      <Container>
        <ExplorerIntro />
        <div
          aria-busy
          className="mt-10 grid gap-10 lg:grid-cols-[var(--container-filters)_minmax(0,1fr)]"
        >
          <p className="sr-only" role="status">
            Loading the explorer
          </p>
          <div aria-hidden className="hidden space-y-6 lg:block">
            {FILTERS.map((filter) => (
              <div key={filter} className="space-y-2">
                <div className="h-4 w-20 rounded-sm bg-muted" />
                <div className="h-9 rounded-lg bg-muted" />
              </div>
            ))}
          </div>
          <div aria-hidden className="min-w-0">
            <div className="h-5 w-40 rounded-sm bg-muted" />
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {[1, 2].map((chart) => (
                <div key={chart} className="rounded-lg border bg-card p-5">
                  <div className="h-5 w-48 rounded-sm bg-muted" />
                  <div className="mt-2 h-4 w-56 rounded-sm bg-muted" />
                  <div className="mt-4 h-chart rounded-md bg-muted" />
                </div>
              ))}
            </div>
            <div className="mt-8 h-table rounded-lg border bg-card" />
          </div>
        </div>
      </Container>
    </Section>
  )
}
