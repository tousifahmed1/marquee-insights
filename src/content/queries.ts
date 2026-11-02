import { defineQuery } from 'groq'

const IMAGE = /* groq */ `
  alt,
  hotspot { x, y, width, height },
  crop { top, bottom, left, right },
  asset->{ _id, metadata { lqip, dimensions { width, height } } }
`

const LINK = /* groq */ `label, href`

const SEO = /* groq */ `
  title,
  description,
  noindex,
  ogImage { ${IMAGE} }
`

const REPORT_SUMMARY = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  category,
  excerpt,
  coverImage { ${IMAGE} }
`

const REPORT_FILTER = /* groq */ `
  _type == "report"
  && defined(slug.current)
  && ($category == null || category == $category)
`

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    siteName,
    navLinks[] { _key, ${LINK} },
    footerLinks[] { _key, ${LINK} },
    defaultSeoTitle,
    defaultSeoDescription,
    defaultOgImage { ${IMAGE} }
  }
`)

export const PAGE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    sections[] {
      _key,
      _type,
      _type == "hero" => {
        eyebrow,
        heading,
        subheading,
        primaryCta { ${LINK} },
        secondaryCta { ${LINK} },
        image { ${IMAGE} }
      },
      _type == "featureGrid" => {
        heading,
        items[] { _key, icon, title, text }
      },
      _type == "stats" => {
        heading,
        items[] { _key, value, label }
      },
      _type == "quote" => { text, author, role },
      _type == "ctaBanner" => {
        heading,
        text,
        button { ${LINK} }
      }
    },
    seo { ${SEO} }
  }
`)

export const REPORTS_QUERY = defineQuery(`
  {
    "items": *[${REPORT_FILTER}] | order(publishedAt desc, _id asc) [$start...$end] {
      ${REPORT_SUMMARY}
    },
    "total": count(*[${REPORT_FILTER}])
  }
`)

export const REPORT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "report" && slug.current == $slug][0] {
    ${REPORT_SUMMARY},
    "updatedAt": _updatedAt,
    body[] {
      ...,
      _type == "image" => {
        _key,
        _type,
        caption,
        ${IMAGE}
      }
    },
    seo { ${SEO} }
  }
`)

export const SITEMAP_QUERY = defineQuery(`
  {
    "pages": *[_type == "page" && defined(slug.current) && seo.noindex != true] {
      "slug": slug.current,
      "updatedAt": _updatedAt
    },
    "reports": *[_type == "report" && defined(slug.current) && seo.noindex != true]
      | order(publishedAt desc) {
      "slug": slug.current,
      "updatedAt": _updatedAt
    }
  }
`)

export const REDIRECTS_QUERY = defineQuery(`
  *[_type == "redirect" && defined(from) && defined(to)] { from, to, permanent }
`)
