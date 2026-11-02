import { Link } from '@tanstack/react-router'

import { CmsImage } from '@/components/cms-image'
import type { ReportSummary } from '@/content'

import { ReportMeta } from './report-meta'

export function ReportCard({ report }: { report: ReportSummary }) {
  return (
    <article className="group relative grid gap-6 border-t py-10 md:grid-cols-[16rem_1fr] md:gap-10">
      {report.coverImage ? (
        <CmsImage
          image={report.coverImage}
          aspectRatio={16 / 10}
          widths={[320, 480, 640]}
          sizes="(min-width: 48rem) 16rem, 100vw"
          className="rounded-md"
        />
      ) : (
        <div aria-hidden className="hidden aspect-[16/10] rounded-md bg-muted md:block" />
      )}
      <div>
        <ReportMeta report={report} />
        <h2 className="mt-3 text-3xl">
          <Link
            to="/reports/$slug"
            params={{ slug: report.slug }}
            className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-primary group-hover:decoration-2 group-hover:underline-offset-4"
          >
            {report.title}
          </Link>
        </h2>
        {report.excerpt ? (
          <p className="mt-3 max-w-prose text-muted-foreground">{report.excerpt}</p>
        ) : null}
      </div>
    </article>
  )
}
