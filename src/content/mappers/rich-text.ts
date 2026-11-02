import type { RichTextBlock, RichTextLink, RichTextNode, RichTextSpan } from '../types'
import { key, list, mapImage, record, safeHref, text } from './primitives'
import type { UnknownRecord } from './primitives'

const BLOCK_STYLES: readonly RichTextBlock['style'][] = ['normal', 'h2', 'h3', 'h4']
const LIST_ITEMS: readonly NonNullable<RichTextBlock['listItem']>[] = ['bullet', 'number']
const DECORATORS = new Set(['strong', 'em'])

function mapMarkDefs(raw: unknown): RichTextLink[] {
  return list(raw).flatMap((value) => {
    const def = record(value)
    const _key = text(def?._key)
    const href = safeHref(def?.href)
    if (def?._type !== 'link' || !_key || !href) return []
    return [{ _type: 'link', _key, href }]
  })
}

function mapSpans(raw: unknown, allowedMarks: Set<string>): RichTextSpan[] {
  return list(raw).flatMap((value, index) => {
    const span = record(value)
    if (span?._type !== 'span' || typeof span.text !== 'string') return []
    const marks = list(span.marks).filter(
      (mark): mark is string => typeof mark === 'string' && allowedMarks.has(mark),
    )
    return [{ _type: 'span', _key: key(span._key, `span-${index}`), text: span.text, marks }]
  })
}

function mapBlock(raw: UnknownRecord, _key: string): RichTextBlock | null {
  const markDefs = mapMarkDefs(raw.markDefs)
  const allowedMarks = new Set([...DECORATORS, ...markDefs.map((def) => def._key)])
  const children = mapSpans(raw.children, allowedMarks)
  if (!children.some((span) => span.text.trim() !== '')) return null

  const style = BLOCK_STYLES.find((value) => value === raw.style) ?? 'normal'
  const block: RichTextBlock = { _type: 'block', _key, style, children, markDefs }
  const listItem = LIST_ITEMS.find((value) => value === raw.listItem)
  if (listItem) {
    block.listItem = listItem
    block.level = typeof raw.level === 'number' && raw.level >= 1 ? Math.floor(raw.level) : 1
  }
  return block
}

function mapNode(raw: UnknownRecord, _key: string): RichTextNode | null {
  switch (raw._type) {
    case 'block':
      return mapBlock(raw, _key)
    case 'image': {
      const image = mapImage(raw)
      return image ? { _type: 'image', _key, image, caption: text(raw.caption) } : null
    }
    case 'pullQuote': {
      const quote = text(raw.text)
      return quote ? { _type: 'pullQuote', _key, text: quote, attribution: text(raw.attribution) } : null
    }
    default:
      return null
  }
}

export function mapRichText(raw: unknown): RichTextNode[] {
  return list(raw).flatMap((value, index) => {
    const node = record(value)
    if (!node) return []
    const mapped = mapNode(node, key(node._key, `node-${index}`))
    return mapped ? [mapped] : []
  })
}
