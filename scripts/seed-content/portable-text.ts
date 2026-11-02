type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef = { _type: 'link'; _key: string; href: string }

export type Block = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3' | 'h4'
  listItem?: 'bullet' | 'number'
  level?: number
  markDefs: LinkDef[]
  children: Span[]
}

export type BodyNode =
  | Block
  | { _type: 'pullQuote'; _key: string; text: string; attribution?: string }
  | {
      _type: 'image'
      _key: string
      asset: { _type: 'reference'; _ref: string }
      alt: string
      caption?: string
    }

let counter = 0
export const key = (prefix = 'k') => `${prefix}${(counter++).toString(36).padStart(4, '0')}`

const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g

function inline(text: string): Pick<Block, 'children' | 'markDefs'> {
  const children: Span[] = []
  const markDefs: LinkDef[] = []
  let last = 0
  const push = (value: string, marks: string[] = []) => {
    if (value) children.push({ _type: 'span', _key: key('s'), text: value, marks })
  }
  for (const match of text.matchAll(INLINE)) {
    push(text.slice(last, match.index))
    const [, label, href, strong, em] = match
    if (label && href) {
      const def: LinkDef = { _type: 'link', _key: key('l'), href }
      markDefs.push(def)
      push(label, [def._key])
    } else if (strong) {
      push(strong, ['strong'])
    } else if (em) {
      push(em, ['em'])
    }
    last = (match.index ?? 0) + match[0].length
  }
  push(text.slice(last))
  return { children, markDefs }
}

const block = (style: Block['style'], text: string): Block => ({
  _type: 'block',
  _key: key('b'),
  style,
  ...inline(text),
})

export const p = (text: string) => block('normal', text)
export const h2 = (text: string) => block('h2', text)
export const h3 = (text: string) => block('h3', text)

const listOf = (listItem: 'bullet' | 'number', items: string[]): Block[] =>
  items.map((text) => ({ ...block('normal', text), listItem, level: 1 }))

export const bullets = (items: string[]) => listOf('bullet', items)
export const numbered = (items: string[]) => listOf('number', items)

export const pull = (text: string, attribution?: string): BodyNode => ({
  _type: 'pullQuote',
  _key: key('q'),
  text,
  ...(attribution ? { attribution } : {}),
})

export const figure = (assetId: string, alt: string, caption?: string): BodyNode => ({
  _type: 'image',
  _key: key('i'),
  asset: { _type: 'reference', _ref: assetId },
  alt,
  ...(caption ? { caption } : {}),
})
