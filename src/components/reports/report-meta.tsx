import { categoryLabel } from '@/content'
import type { ReportSummary } from '@/content'
import { formatDate } from '@/lib/format-date'
import { cn } from '@/lib/utils'

type ReportMetaProps = {
  report: Pick<ReportSummary, 'category' | 'publishedAt'>
  className?: string
}

export function ReportMeta({ report, className }: ReportMetaProps) {
  if (!report.category && !report.publishedAt) return null
  return (
    <p className={cn('flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground', className)}>
      {report.category ? (
        <span className="font-medium text-highlight">{categoryLabel(report.category)}</span>
      ) : null}
      {report.publishedAt ? (
        <time dateTime={report.publishedAt}>{formatDate(report.publishedAt)}</time>
      ) : null}
    </p>
  )
}
