// The public origin used in canonical URLs, Open Graph tags, the sitemap and
// structured data. Cached pages are shared by every visitor, so this is fixed
// at build time rather than read from the request.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? 'https://marquee-insights.tousifahmed.workers.dev'
).replace(/\/+$/, '')

export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString()
}
