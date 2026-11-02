import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { CmsImage } from '@/components/cms-image'
import { Container } from '@/components/container'
import { ReportMeta } from '@/components/reports/report-meta'
import { RichText } from '@/components/rich-text/rich-text'
import { Section } from '@/components/section'
import { getReport } from '@/content'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/reports/$slug')({
  loader: async ({ params }) => {
    const report = await getReport({ data: { slug: params.slug } })
    if (!report) throw notFound()
    return report
  },
  head: ({ loaderData, match }) =>
    seoHead(
      resolveSeo(match.context.siteSettings, {
        seo: loaderData?.seo,
        title: loaderData?.title,
        description: loaderData?.excerpt,
        image: loaderData?.coverImage,
      }),
    ),
  headers: () => cacheHeaders('content'),
  component: ReportPage,
})

function ReportPage() {
  const report = Route.useLoaderData()
  return (
    <article>
      <Section className="pb-12">
        <Container width="prose">
          <ReportMeta report={report} />
          <h1 className="mt-4 text-5xl">{report.title}</h1>
          {report.excerpt ? (
            <p className="mt-6 text-xl text-muted-foreground">{report.excerpt}</p>
          ) : null}
        </Container>
      </Section>
      {report.coverImage ? (
        <Container>
          <CmsImage
            image={report.coverImage}
            aspectRatio={16 / 9}
            sizes="(min-width: 76rem) 71rem, 100vw"
            priority
            className="rounded-lg"
          />
        </Container>
      ) : null}
      <Section className="pt-12">
        <Container width="prose">
          <RichText value={report.body} />
          <p className="mt-16 border-t pt-8">
            <Link
              to="/reports"
              className="font-medium underline decoration-primary decoration-2 underline-offset-4"
            >
              Back to all reports
            </Link>
          </p>
        </Container>
      </Section>
    </article>
  )
}
