import { createFileRoute } from '@tanstack/react-router'

import { Container } from '@/components/container'
import { ExplorerCharts } from '@/components/explorer/explorer-charts'
import { ExplorerError } from '@/components/explorer/explorer-error'
import { ExplorerIntro, ExplorerPending } from '@/components/explorer/explorer-pending'
import { FilterPanel } from '@/components/explorer/filter-panel'
import { MobileFilters } from '@/components/explorer/mobile-filters'
import { ResultsStatus } from '@/components/explorer/results-status'
import { ResultsTable } from '@/components/explorer/results-table'
import { useExplorerData } from '@/components/explorer/use-explorer-data'
import { Section } from '@/components/section'
import { loadExplorer } from '@/data/explorer-queries'
import { cleanSearch } from '@/data/search'
import type { ExplorerSearch } from '@/data/search'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/explore')({
  validateSearch: (search: Record<string, unknown>): ExplorerSearch => cleanSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps, cause }) => loadExplorer(context.queryClient, deps, cause),
  head: ({ match }) =>
    match.status === 'notFound'
      ? {}
      : seoHead(
      resolveSeo(match.context.siteSettings, {
        title: 'Audience explorer',
        path: '/explore',
        description:
          'Filter 50,000 synthetic survey responses from 12 monthly waves by show, platform, region and age group.',
      }),
    ),
  headers: () => cacheHeaders('noStore'),
  errorComponent: ExplorerError,
  // The first data is a round trip to Neon (about 300ms from far away), so a
  // client-side visit shows the explorer layout at once instead of waiting on
  // the previous page. Preloaded data skips it.
  pendingComponent: ExplorerPending,
  pendingMs: 0,
  pendingMinMs: 0,
  component: ExplorerPage,
})

function ExplorerPage() {
  const search = Route.useSearch()
  const { query, options, rows, charts, updating } = useExplorerData(search)

  return (
    <Section className="pt-12">
      <Container>
        <ExplorerIntro />

        <div className="mt-10 grid gap-10 lg:grid-cols-[var(--container-filters)_minmax(0,1fr)]">
          <aside aria-label="Filters" className="hidden lg:block">
            <FilterPanel search={search} options={options} />
          </aside>

          <div aria-busy={updating} className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ResultsStatus total={rows.data?.total} updating={updating} />
              <MobileFilters search={search} options={options} total={rows.data?.total} />
            </div>
            <div
              className={cn(
                'mt-6 space-y-8 transition-opacity duration-200',
                updating && 'opacity-60',
              )}
            >
              <ExplorerCharts
                charts={charts.data}
                error={charts.isError}
                onRetry={() => void charts.refetch()}
              />
              <ResultsTable
                page={rows.data}
                query={query}
                error={rows.isError}
                onRetry={() => void rows.refetch()}
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
