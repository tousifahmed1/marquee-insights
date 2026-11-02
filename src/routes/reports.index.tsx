import { createFileRoute, notFound } from '@tanstack/react-router'

import { Container } from '@/components/container'
import { CategoryFilter } from '@/components/reports/category-filter'
import { Pagination } from '@/components/reports/pagination'
import { ReportCard } from '@/components/reports/report-card'
import { Section } from '@/components/section'
import { categoryLabel, getReports, parseCategory, parsePage } from '@/content'
import type { ReportCategory } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

function reportsPath(category: ReportCategory | null, page: number): string {
  const search = new URLSearchParams()
  if (category) search.set('category', category)
  if (page > 1) search.set('page', String(page))
  return search.size === 0 ? '/reports' : `/reports?${search}`
}

type ReportsSearch = { page?: number; category?: ReportCategory }

export const Route = createFileRoute('/reports/')({
  validateSearch: (search: Record<string, unknown>): ReportsSearch => {
    const page = parsePage(search.page)
    const category = parseCategory(search.category)
    return { ...(page > 1 ? { page } : {}), ...(category ? { category } : {}) }
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1, category: search.category ?? null }),
  loader: async ({ deps }) => {
    const reports = await getReports({ data: deps })
    if (deps.page > reports.totalPages) throw notFound()
    return reports
  },
  head: ({ loaderData, match }) => {
    const category = loaderData?.category ? `${categoryLabel(loaderData.category)} reports` : 'Reports'
    const page = loaderData && loaderData.page > 1 ? `, page ${loaderData.page}` : ''
    return seoHead(
      resolveSeo(match.context.siteSettings, {
        title: `${category}${page}`,
        description: 'Published research on viewing habits, release strategy and audience loyalty.',
        path: loaderData ? reportsPath(loaderData.category, loaderData.page) : '/reports',
      }),
    )
  },
  headers: () => cacheHeaders('content'),
  component: ReportsPage,
})

function ReportsPage() {
  const { items, page, totalPages, category, total } = Route.useLoaderData()
  return (
    <Section>
      <Container>
        <h1 className="text-5xl">Reports</h1>
        <p className="mt-6 max-w-prose text-lg text-muted-foreground">
          Published research on viewing habits, release strategy and audience loyalty, from our
          monthly panel waves.
        </p>
        <div className="mt-10">
          <CategoryFilter active={category} />
        </div>
        <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
          {total === 1 ? '1 report' : `${total} reports`}
          {category ? ` in ${categoryLabel(category)}` : ''}
        </p>
        {items.length > 0 ? (
          <div className="mt-4 border-b">
            {items.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <p className="mt-10 max-w-prose text-lg">
            No reports in this category yet. Try another category, or see all reports.
          </p>
        )}
        <Pagination page={page} totalPages={totalPages} category={category} />
      </Container>
    </Section>
  )
}
