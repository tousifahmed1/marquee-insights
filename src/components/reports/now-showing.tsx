import { Link } from '@tanstack/react-router'

import { MarqueeFrame } from '@/components/marquee-frame'
import type { ReportSummary } from '@/content'

import { ReportMeta } from './report-meta'

export function NowShowing({ report }: { report: ReportSummary }) {
  return (
    <MarqueeFrame>
      <article className="group">
        <p className="font-display text-xl text-highlight">Now showing</p>
        <h2 className="mt-5 text-4xl break-words">
          <Link
            to="/reports/$slug"
            params={{ slug: report.slug }}
            className="decoration-highlight decoration-2 underline-offset-4 after:absolute after:inset-0 after:rounded-lg hover:underline focus-visible:underline"
          >
            {report.title}
          </Link>
        </h2>
        {report.excerpt ? (
          <p className="mt-4 line-clamp-3 text-muted-foreground">{report.excerpt}</p>
        ) : null}
        <ReportMeta report={report} className="mt-6" />
      </article>
    </MarqueeFrame>
  )
}
