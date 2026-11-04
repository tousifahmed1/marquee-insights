import { notFound } from '@tanstack/react-router'

import { getLatestReport, getPage, getReport } from './functions'
import { HOME_SLUG } from './urls'

// Route loaders shared by the published routes and their /preview copies.
type Mode = { preview: boolean }

export async function loadPage(slug: string, { preview }: Mode) {
  // The home page document is only served at /.
  if (slug === HOME_SLUG) throw notFound()
  const page = await getPage({ data: { slug, preview } })
  if (!page) throw notFound()
  return page
}

// The newest report is always the published one, as visitors would see it.
export async function loadHome({ preview }: Mode) {
  const [page, latest] = await Promise.all([
    getPage({ data: { slug: HOME_SLUG, preview } }),
    getLatestReport(),
  ])
  if (!page) throw notFound()
  return { page, latest }
}

export async function loadReport(slug: string, { preview }: Mode) {
  const report = await getReport({ data: { slug, preview } })
  if (!report) throw notFound()
  return report
}
