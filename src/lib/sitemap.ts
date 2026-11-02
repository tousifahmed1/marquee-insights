import type { SitemapEntry } from '@/content'

import { absoluteUrl } from './site'

// Pages that exist in code rather than as CMS documents.
export const STATIC_SITEMAP_PATHS = ['/', '/reports', '/explore']

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const byPath = new Map<string, SitemapEntry>()
  for (const path of STATIC_SITEMAP_PATHS) byPath.set(path, { path, updatedAt: null })
  for (const entry of entries) {
    const existing = byPath.get(entry.path)
    byPath.set(entry.path, { path: entry.path, updatedAt: entry.updatedAt ?? existing?.updatedAt ?? null })
  }
  const urls = [...byPath.values()].map(({ path, updatedAt }) =>
    [
      '  <url>',
      `    <loc>${escapeXml(absoluteUrl(path))}</loc>`,
      ...(updatedAt ? [`    <lastmod>${escapeXml(updatedAt)}</lastmod>`] : []),
      '  </url>',
    ].join('\n'),
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

export function buildRobotsTxt(): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /preview',
    'Disallow: /api/',
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    '',
  ].join('\n')
}
