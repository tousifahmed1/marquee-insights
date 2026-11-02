import type { ReportCategory } from './categories'

export type CmsLink = {
  label: string
  href: string
  external: boolean
}

export type CmsImage = {
  assetId: string
  alt: string
  width: number
  height: number
  lqip: string | null
  hotspot: { x: number; y: number; width: number; height: number } | null
  crop: { top: number; bottom: number; left: number; right: number } | null
}

export type Seo = {
  title: string | null
  description: string | null
  ogImage: CmsImage | null
  noindex: boolean
}

export type SiteSettings = {
  siteName: string
  navLinks: CmsLink[]
  footerLinks: CmsLink[]
  defaultSeo: {
    title: string
    description: string
    ogImage: CmsImage | null
  }
}

export const FEATURE_ICONS = [
  'chart',
  'users',
  'tv',
  'film',
  'gamepad',
  'trophy',
  'search',
  'globe',
  'clock',
  'trending-up',
  'layers',
  'message',
] as const

export type FeatureIcon = (typeof FEATURE_ICONS)[number]

export type HeroBlock = {
  _type: 'hero'
  _key: string
  eyebrow: string | null
  heading: string
  subheading: string | null
  primaryCta: CmsLink | null
  secondaryCta: CmsLink | null
  image: CmsImage | null
}

export type FeatureGridBlock = {
  _type: 'featureGrid'
  _key: string
  heading: string
  items: { _key: string; icon: FeatureIcon; title: string; text: string }[]
}

export type StatsBlock = {
  _type: 'stats'
  _key: string
  heading: string | null
  items: { _key: string; value: string; label: string }[]
}

export type QuoteBlock = {
  _type: 'quote'
  _key: string
  text: string
  author: string
  role: string | null
}

export type CtaBannerBlock = {
  _type: 'ctaBanner'
  _key: string
  heading: string
  text: string | null
  button: CmsLink
}

export type SectionBlock =
  | HeroBlock
  | FeatureGridBlock
  | StatsBlock
  | QuoteBlock
  | CtaBannerBlock

export type Page = {
  id: string
  title: string
  slug: string
  sections: SectionBlock[]
  seo: Seo
}

export type RichTextImage = {
  _type: 'image'
  _key: string
  image: CmsImage
  caption: string | null
}

export type RichTextPullQuote = {
  _type: 'pullQuote'
  _key: string
  text: string
  attribution: string | null
}

export type RichTextLink = { _type: 'link'; _key: string; href: string }

export type RichTextSpan = { _type: 'span'; _key: string; text: string; marks: string[] }

export type RichTextBlock = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3' | 'h4'
  listItem?: 'bullet' | 'number'
  level?: number
  children: RichTextSpan[]
  markDefs: RichTextLink[]
}

export type RichTextNode = RichTextBlock | RichTextImage | RichTextPullQuote

export type ReportSummary = {
  id: string
  title: string
  slug: string
  publishedAt: string | null
  category: ReportCategory | null
  excerpt: string | null
  coverImage: CmsImage | null
}

export type Report = ReportSummary & {
  body: RichTextNode[]
  seo: Seo
}

export type ReportList = {
  items: ReportSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  category: ReportCategory | null
}
