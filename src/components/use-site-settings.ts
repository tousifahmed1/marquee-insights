import { useRouteContext } from '@tanstack/react-router'

import { NAV_LINKS } from '@/components/nav-links'
import type { CmsLink, SiteSettings } from '@/content'
import { mapSiteSettings } from '@/content/mappers'

const FALLBACK_SETTINGS = mapSiteSettings(undefined)
const FALLBACK_LINKS: CmsLink[] = NAV_LINKS.map((link) => ({ ...link, external: false }))

export function useSiteSettings(): SiteSettings {
  const settings: SiteSettings | undefined = useRouteContext({
    from: '__root__',
    select: (context) => context.siteSettings,
  })
  const resolved = settings ?? FALLBACK_SETTINGS
  return {
    ...resolved,
    navLinks: resolved.navLinks.length > 0 ? resolved.navLinks : FALLBACK_LINKS,
    footerLinks: resolved.footerLinks.length > 0 ? resolved.footerLinks : FALLBACK_LINKS,
  }
}
