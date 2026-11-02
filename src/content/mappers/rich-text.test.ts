import { describe, expect, it } from 'vitest'

import { mapRichText } from './rich-text'
import { validImage } from './test-fixtures'

const span = (text: string, marks: unknown[] = []) => ({ _type: 'span', _key: `s-${text}`, text, marks })

describe('mapRichText', () => {
  it('returns an empty list for missing or malformed bodies', () => {
    for (const value of [undefined, null, 'text', { _type: 'block' }]) {
      expect(mapRichText(value)).toEqual([])
    }
  })

  it('keeps safe links and strips unsafe ones along with their marks', () => {
    const [block] = mapRichText([
      {
        _type: 'block',
        _key: 'b',
        style: 'normal',
        markDefs: [
          { _type: 'link', _key: 'ok', href: '/explore' },
          { _type: 'link', _key: 'bad', href: 'javascript:alert(1)' },
        ],
        children: [span('safe', ['ok', 'strong']), span('unsafe', ['bad', 'em', 'blink'])],
      },
    ])
    expect(block).toEqual({
      _type: 'block',
      _key: 'b',
      style: 'normal',
      markDefs: [{ _type: 'link', _key: 'ok', href: '/explore' }],
      children: [
        { _type: 'span', _key: 's-safe', text: 'safe', marks: ['ok', 'strong'] },
        { _type: 'span', _key: 's-unsafe', text: 'unsafe', marks: ['em'] },
      ],
    })
  })

  it('falls back to a paragraph for unknown styles and ignores unknown list types', () => {
    const [block] = mapRichText([
      { _type: 'block', style: 'h1', listItem: 'checkbox', children: [span('Title')] },
    ])
    expect(block).toMatchObject({ style: 'normal', _key: 'node-0' })
    expect(block).not.toHaveProperty('listItem')
  })

  it('keeps list items with a valid level', () => {
    const [block] = mapRichText([
      { _type: 'block', _key: 'l', listItem: 'bullet', level: 0, children: [span('Item')] },
    ])
    expect(block).toMatchObject({ listItem: 'bullet', level: 1 })
  })

  it('drops empty paragraphs, spans without text and unknown node types', () => {
    expect(
      mapRichText([
        { _type: 'block', children: [span('   ')] },
        { _type: 'block', children: [{ _type: 'span', text: 5 }] },
        { _type: 'video', url: 'https://example.com' },
        { _type: 'pullQuote', text: '' },
        null,
      ]),
    ).toEqual([])
  })

  it('keeps images only when they have alt text', () => {
    const nodes = mapRichText([
      { _type: 'image', _key: 'i1', ...validImage, caption: 'Base: 2,104' },
      { _type: 'image', _key: 'i2', ...validImage, alt: '' },
    ])
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({ _type: 'image', _key: 'i1', caption: 'Base: 2,104' })
  })

  it('maps pull quotes with an optional attribution', () => {
    expect(mapRichText([{ _type: 'pullQuote', _key: 'q', text: 'I loved it.' }])).toEqual([
      { _type: 'pullQuote', _key: 'q', text: 'I loved it.', attribution: null },
    ])
  })
})
