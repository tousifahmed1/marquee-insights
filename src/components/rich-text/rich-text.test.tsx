import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { RichTextNode } from '@/content'
import { mapRichText } from '@/content/mappers'
import { validImage } from '@/content/mappers/test-fixtures'
import { renderWithRouter } from '@/test/render'

import { RichText } from './rich-text'

beforeAll(() => {
  vi.stubEnv('SANITY_STUDIO_PROJECT_ID', 'test-project')
  vi.stubEnv('SANITY_STUDIO_DATASET', 'test')
})

const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: text, text, marks })

const body = mapRichText([
  { _type: 'block', _key: 'h', style: 'h2', children: [span('Who leaves')] },
  {
    _type: 'block',
    _key: 'p',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'l', href: '/explore' }],
    children: [span('See the '), span('data explorer', ['l']), span(' for '), span('more', ['strong'])],
  },
  { _type: 'block', _key: 'b1', listItem: 'bullet', level: 1, children: [span('First point')] },
  { _type: 'block', _key: 'n1', listItem: 'number', level: 1, children: [span('Step one')] },
  { _type: 'image', _key: 'i', ...validImage, caption: 'Base: 2,104' },
  { _type: 'pullQuote', _key: 'q', text: 'I loved the first one.' },
])

describe('RichText', () => {
  it('renders every supported Portable Text type', async () => {
    const html = await renderWithRouter(<RichText value={body} />)
    expect(html).toMatch(/<h2[^>]*>Who leaves<\/h2>/)
    expect(html).toMatch(/<a[^>]*href="\/explore"[^>]*>data explorer<\/a>/)
    expect(html).toMatch(/<strong[^>]*>more<\/strong>/)
    expect(html).toMatch(/<ul[^>]*><li[^>]*>First point<\/li><\/ul>/)
    expect(html).toMatch(/<ol[^>]*><li[^>]*>Step one<\/li><\/ol>/)
    const img = html.match(/<img[^>]*>/)?.[0] ?? ''
    expect(img).toContain('alt="Rows of amber lights"')
    expect(img).toMatch(/ width="\d+"/)
    expect(img).toMatch(/ height="\d+"/)
    expect(html).toContain('Base: 2,104')
    expect(html).toContain('<blockquote')
  })

  it('renders link text without an anchor when the href is unsafe', async () => {
    const value = [
      {
        _type: 'block',
        _key: 'p',
        style: 'normal',
        markDefs: [{ _type: 'link', _key: 'l', href: 'javascript:alert(1)' }],
        children: [{ _type: 'span', _key: 's', text: 'click me', marks: ['l'] }],
      },
    ] as unknown as RichTextNode[]
    const html = await renderWithRouter(<RichText value={value} />)
    expect(html).toContain('click me')
    expect(html).not.toContain('javascript:')
  })

  it('ignores unknown node types and renders nothing for an empty body', async () => {
    const value = [{ _type: 'video', _key: 'v', url: 'https://example.com' }] as unknown as RichTextNode[]
    expect(await renderWithRouter(<RichText value={value} />)).not.toContain('example.com')
    expect(await renderWithRouter(<RichText value={[]} />)).not.toContain('<p')
  })
})
