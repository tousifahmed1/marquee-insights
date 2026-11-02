import { Link } from '@tanstack/react-router'

import { CmsImage } from '@/components/cms-image'
import { Container } from '@/components/container'
import { RichText } from '@/components/rich-text/rich-text'
import { Section } from '@/components/section'
import type { Report } from '@/content'

import { ReportMeta } from './report-meta'

export function ReportArticle({ report }: { report: Report }) {
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
              className="font-medium underline decoration-highlight decoration-2 underline-offset-4"
            >
              Back to all reports
            </Link>
          </p>
        </Container>
      </Section>
    </article>
  )
}
