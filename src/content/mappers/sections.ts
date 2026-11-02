import { FEATURE_ICONS } from '../types'
import type {
  CtaBannerBlock,
  FeatureGridBlock,
  FeatureIcon,
  HeroBlock,
  QuoteBlock,
  SectionBlock,
  StatsBlock,
} from '../types'
import { key, list, mapImage, mapLink, record, text } from './primitives'
import type { UnknownRecord } from './primitives'

const DEFAULT_ICON: FeatureIcon = 'chart'

function featureIcon(value: unknown): FeatureIcon {
  return FEATURE_ICONS.find((icon) => icon === value) ?? DEFAULT_ICON
}

function mapHero(raw: UnknownRecord, _key: string): HeroBlock | null {
  const heading = text(raw.heading)
  if (!heading) return null
  return {
    _type: 'hero',
    _key,
    eyebrow: text(raw.eyebrow),
    heading,
    subheading: text(raw.subheading),
    primaryCta: mapLink(raw.primaryCta),
    secondaryCta: mapLink(raw.secondaryCta),
    image: mapImage(raw.image),
  }
}

function mapFeatureGrid(raw: UnknownRecord, _key: string): FeatureGridBlock | null {
  const items = list(raw.items).flatMap((value, index) => {
    const item = record(value)
    const title = text(item?.title)
    const body = text(item?.text)
    if (!title || !body) return []
    return [{ _key: key(item?._key, `item-${index}`), icon: featureIcon(item?.icon), title, text: body }]
  })
  if (items.length === 0) return null
  return { _type: 'featureGrid', _key, heading: text(raw.heading) ?? '', items }
}

function mapStats(raw: UnknownRecord, _key: string): StatsBlock | null {
  const items = list(raw.items).flatMap((value, index) => {
    const item = record(value)
    const statValue = text(item?.value)
    const label = text(item?.label)
    if (!statValue || !label) return []
    return [{ _key: key(item?._key, `stat-${index}`), value: statValue, label }]
  })
  if (items.length === 0) return null
  return { _type: 'stats', _key, heading: text(raw.heading), items }
}

function mapQuote(raw: UnknownRecord, _key: string): QuoteBlock | null {
  const quoteText = text(raw.text)
  const author = text(raw.author)
  if (!quoteText || !author) return null
  return { _type: 'quote', _key, text: quoteText, author, role: text(raw.role) }
}

function mapCtaBanner(raw: UnknownRecord, _key: string): CtaBannerBlock | null {
  const heading = text(raw.heading)
  const button = mapLink(raw.button)
  if (!heading || !button) return null
  return { _type: 'ctaBanner', _key, heading, text: text(raw.text), button }
}

const SECTION_MAPPERS: Record<
  SectionBlock['_type'],
  (raw: UnknownRecord, key: string) => SectionBlock | null
> = {
  hero: mapHero,
  featureGrid: mapFeatureGrid,
  stats: mapStats,
  quote: mapQuote,
  ctaBanner: mapCtaBanner,
}

function isSectionType(value: unknown): value is SectionBlock['_type'] {
  return typeof value === 'string' && Object.hasOwn(SECTION_MAPPERS, value)
}

export function mapSections(raw: unknown): SectionBlock[] {
  return list(raw).flatMap((value, index) => {
    const section = record(value)
    if (!section || !isSectionType(section._type)) return []
    const block = SECTION_MAPPERS[section._type](section, key(section._key, `section-${index}`))
    return block ? [block] : []
  })
}
