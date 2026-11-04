import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { SectionBlock } from '@/content'
import { mapSections } from '@/content/mappers'
import { renderWithRouter } from '@/test/render'

import { SectionRenderer } from './section-renderer'

beforeAll(() => {
  vi.stubEnv('SANITY_STUDIO_PROJECT_ID', 'test-project')
  vi.stubEnv('SANITY_STUDIO_DATASET', 'test')
})

const sparseFixture = [
  { _key: 'hero', _type: 'hero', heading: 'Only a heading' },
  { _key: 'grid', _type: 'featureGrid', items: [{ icon: 'unknown', title: 'Reach', text: 'Who starts.' }] },
  { _key: 'stats', _type: 'stats', items: [{ value: '12,400', label: 'viewers' }] },
  { _key: 'quote', _type: 'quote', text: 'Useful.', author: 'A. Viewer' },
  { _key: 'cta', _type: 'ctaBanner', heading: 'Ask a question', button: { label: 'Explore', href: '/explore' } },
  { _key: 'empty-hero', _type: 'hero' },
  { _key: 'video', _type: 'video', url: 'https://example.com' },
]

describe('SectionRenderer', () => {
  it('renders every block type from a fixture with missing optional fields', async () => {
    const html = await renderWithRouter(<SectionRenderer sections={mapSections(sparseFixture)} />)
    expect(html).toContain('<h1')
    expect(html).toContain('Only a heading')
    expect(html).toContain('Reach')
    expect(html).toContain('12,400')
    expect(html).toContain('A. Viewer')
    expect(html).toContain('href="/explore"')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('example.com')
  })

  it('renders one h1 even when a page has two heroes', async () => {
    const html = await renderWithRouter(
      <SectionRenderer
        sections={mapSections([
          { _key: 'a', _type: 'hero', heading: 'First' },
          { _key: 'b', _type: 'hero', heading: 'Second' },
        ])}
      />,
    )
    expect(html.match(/<h1/g)).toHaveLength(1)
  })

  it('puts the hero aside beside the first hero only', async () => {
    const html = await renderWithRouter(
      <SectionRenderer
        heroAside={<p>Beside the hero</p>}
        sections={mapSections([
          { _key: 'a', _type: 'hero', heading: 'First' },
          { _key: 'b', _type: 'hero', heading: 'Second' },
        ])}
      />,
    )
    expect(html.match(/Beside the hero/g)).toHaveLength(1)
    expect(html.indexOf('Beside the hero')).toBeLessThan(html.indexOf('Second'))
  })

  it('skips unknown and empty entries that bypass the mapper instead of crashing', async () => {
    const unsafe = [null, { _type: 'carousel', _key: 'x' }, { _type: 'constructor', _key: 'y' }]
    const html = await renderWithRouter(
      <SectionRenderer sections={unsafe as unknown as SectionBlock[]} />,
    )
    expect(html).not.toContain('carousel')
  })

  it('renders nothing for an empty page', async () => {
    const html = await renderWithRouter(<SectionRenderer sections={[]} />)
    expect(html).not.toContain('<section')
  })
})
