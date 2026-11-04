import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'

import { CmsImage } from '@/components/cms-image'
import type { ReportSummary } from '@/content'

import { ReportMeta } from './report-meta'

const COVER = { rest: { scale: 1 }, hover: { scale: 1.04 } }

export function ReportCard({ report }: { report: ReportSummary }) {
  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover="hover"
      className="group relative grid gap-6 border-t py-10 md:grid-cols-[16rem_1fr] md:gap-10"
    >
      {report.coverImage ? (
        <div className="overflow-hidden rounded-md">
          <motion.div variants={COVER} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <CmsImage
              image={report.coverImage}
              aspectRatio={16 / 10}
              widths={[320, 480, 640]}
              sizes="(min-width: 48rem) 16rem, 100vw"
            />
          </motion.div>
        </div>
      ) : (
        <div aria-hidden className="hidden aspect-[16/10] rounded-md bg-muted md:block" />
      )}
      <div>
        <ReportMeta report={report} />
        <h2 className="mt-3 text-3xl break-words">
          <Link
            to="/reports/$slug"
            params={{ slug: report.slug }}
            className="decoration-highlight decoration-2 underline-offset-4 after:absolute after:inset-0 group-focus-within:underline group-hover:underline"
          >
            {report.title}
          </Link>
        </h2>
        {report.excerpt ? (
          <p className="mt-3 max-w-prose text-muted-foreground">{report.excerpt}</p>
        ) : null}
      </div>
    </motion.article>
  )
}
