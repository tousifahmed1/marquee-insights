import { getCliClient } from 'sanity/cli'

import { chartSvg, coverSvg, toPng } from './artwork'
import type { BodyNode } from './portable-text'
import { figure } from './portable-text'
import { platformReports } from './reports-platforms'
import { screenReports } from './reports-screen'
import type { SeedReport } from './report-types'
import { aboutPage, contactPage, homePage, siteSettings } from './site'

type SeedDocument = { _id: string; _type: string } & Record<string, unknown>

const client = getCliClient({ apiVersion: '2026-11-01' })

async function upload(name: string, svg: string): Promise<string> {
  const asset = await client.assets.upload('image', await toPng(svg), {
    filename: `${name}.png`,
  })
  return asset._id
}

async function reportDocument(report: SeedReport) {
  const charts = new Map<string, BodyNode>()
  for (const spec of report.charts ?? []) {
    const assetId = await upload(`chart-${spec.id}`, chartSvg(spec.title, spec.data))
    charts.set(spec.id, figure(assetId, spec.alt, spec.caption))
  }
  const chart = (id: string) => {
    const node = charts.get(id)
    if (!node) throw new Error(`Unknown chart "${id}" in ${report.slug}`)
    return node
  }

  const coverId = report.cover
    ? await upload(`cover-${report.slug}`, coverSvg(report.slug, report.cover.style, report.cover.accent))
    : null

  return {
    _id: `report-${report.slug}`,
    _type: 'report',
    title: report.title,
    slug: { _type: 'slug', current: report.slug },
    publishedAt: report.publishedAt,
    category: report.category,
    coverImage:
      coverId && report.cover
        ? { _type: 'image', asset: { _type: 'reference', _ref: coverId }, alt: report.cover.alt }
        : undefined,
    excerpt: report.excerpt,
    body: report.body?.(chart).flat(),
    seo: report.seoDescription
      ? { _type: 'seo', description: report.seoDescription, noindex: false }
      : undefined,
  }
}

async function main() {
  const { projectId, dataset } = client.config()
  console.log(`Seeding ${projectId}/${dataset}`)

  const images = {
    aboutHero: await upload('about-hero', coverSvg('about', 'arcs', 0)),
    ogDefault: await upload('og-default', coverSvg('og-default', 'bulbs', 0)),
  }
  const reports = await Promise.all([...screenReports, ...platformReports].map(reportDocument))
  const documents: SeedDocument[] = [siteSettings(images), homePage(), aboutPage(images), contactPage(), ...reports]

  const transaction = client.transaction()
  for (const document of documents) transaction.createOrReplace(document)
  await transaction.commit()

  console.log(`Wrote ${documents.length} documents:`)
  for (const document of documents) console.log(`  ${document._type.padEnd(12)} ${document._id}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
