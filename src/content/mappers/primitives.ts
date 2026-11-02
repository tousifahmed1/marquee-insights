import type { CmsImage, CmsLink, Seo } from '../types'

export type UnknownRecord = Record<string, unknown>

export function record(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null
}

export function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function key(value: unknown, fallback: string): string {
  return text(value) ?? fallback
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function positive(value: unknown): number | null {
  const number = finite(value)
  return number !== null && number > 0 ? number : null
}

const SAFE_HREF = /^(\/(?!\/)|https?:\/\/|mailto:)/i

export function safeHref(value: unknown): string | null {
  const href = text(value)
  return href && SAFE_HREF.test(href) ? href : null
}

export function mapLink(raw: unknown): CmsLink | null {
  const link = record(raw)
  const label = text(link?.label)
  const href = safeHref(link?.href)
  if (!label || !href) return null
  return { label, href, external: /^https?:/i.test(href) }
}

export function mapLinks(raw: unknown): CmsLink[] {
  return list(raw)
    .map(mapLink)
    .filter((link): link is CmsLink => link !== null)
}

function mapHotspot(raw: unknown): CmsImage['hotspot'] {
  const hotspot = record(raw)
  const x = finite(hotspot?.x)
  const y = finite(hotspot?.y)
  const width = positive(hotspot?.width)
  const height = positive(hotspot?.height)
  if (x === null || y === null || width === null || height === null) return null
  return { x, y, width, height }
}

function mapCrop(raw: unknown): CmsImage['crop'] {
  const crop = record(raw)
  const top = finite(crop?.top)
  const bottom = finite(crop?.bottom)
  const left = finite(crop?.left)
  const right = finite(crop?.right)
  if (top === null || bottom === null || left === null || right === null) return null
  return { top, bottom, left, right }
}

export function mapImage(raw: unknown): CmsImage | null {
  const image = record(raw)
  const asset = record(image?.asset)
  const metadata = record(asset?.metadata)
  const dimensions = record(metadata?.dimensions)

  const assetId = text(asset?._id)
  const alt = text(image?.alt)
  const width = positive(dimensions?.width)
  const height = positive(dimensions?.height)
  if (!assetId || !alt || !width || !height) return null

  return {
    assetId,
    alt,
    width,
    height,
    lqip: text(metadata?.lqip),
    hotspot: mapHotspot(image?.hotspot),
    crop: mapCrop(image?.crop),
  }
}

export function mapSeo(raw: unknown): Seo {
  const seo = record(raw)
  return {
    title: text(seo?.title),
    description: text(seo?.description),
    ogImage: mapImage(seo?.ogImage),
    noindex: seo?.noindex === true,
  }
}
