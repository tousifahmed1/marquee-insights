// The one place a CMS document maps to its public URL.
export const HOME_SLUG = 'home'

export const pageUrl = (slug: string): string => (slug === HOME_SLUG ? '/' : `/${slug}`)

export const reportUrl = (slug: string): string => `/reports/${slug}`
