import { getPublishedClient } from './client'
import { mapRedirects, mapSitemap } from './mappers'
import { REDIRECTS_QUERY, SITEMAP_QUERY } from './queries'
import type { Redirect, SitemapEntry } from './types'

// Server-only: called from server routes and src/server.ts, never components.

export async function fetchSitemapEntries(): Promise<SitemapEntry[]> {
  return mapSitemap(await getPublishedClient().fetch(SITEMAP_QUERY))
}

export async function fetchRedirects(): Promise<Redirect[]> {
  return mapRedirects(await getPublishedClient().fetch(REDIRECTS_QUERY))
}
