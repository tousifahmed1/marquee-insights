import { describe, expect, it } from 'vitest'

import { list, mapImage, mapLink, mapLinks, mapSeo, record, safeHref, text } from './primitives'
import { validImage } from './test-fixtures'

describe('text', () => {
  it('trims strings and turns blank or non-string values into null', () => {
    expect(text('  Hello ')).toBe('Hello')
    for (const value of ['', '   ', null, undefined, 42, {}, [], true]) {
      expect(text(value)).toBeNull()
    }
  })
})

describe('record and list', () => {
  it('only accept plain objects and arrays', () => {
    expect(record({ a: 1 })).toEqual({ a: 1 })
    expect(record([1])).toBeNull()
    expect(record('x')).toBeNull()
    expect(list('not a list')).toEqual([])
    expect(list(null)).toEqual([])
  })
})

describe('safeHref', () => {
  it.each(['/reports', 'https://example.com', 'http://example.com', 'mailto:hi@example.com'])(
    'allows %s',
    (href) => expect(safeHref(href)).toBe(href),
  )

  it.each(['javascript:alert(1)', 'JAVASCRIPT:alert(1)', '//evil.example', 'data:text/html,x', 'reports', '', 7])(
    'rejects %j',
    (href) => expect(safeHref(href)).toBeNull(),
  )
})

describe('mapLink', () => {
  it('maps internal and external links', () => {
    expect(mapLink({ label: 'Reports', href: '/reports' })).toEqual({
      label: 'Reports',
      href: '/reports',
      external: false,
    })
    expect(mapLink({ label: 'Docs', href: 'https://example.com' })?.external).toBe(true)
  })

  it('drops links without a label or with an unsafe destination', () => {
    expect(mapLink({ href: '/reports' })).toBeNull()
    expect(mapLink({ label: 'Click', href: 'javascript:alert(1)' })).toBeNull()
    expect(mapLink('not a link')).toBeNull()
  })

  it('keeps only the valid links in a list', () => {
    expect(mapLinks([null, { label: 'Home', href: '/' }, { label: '' }, 'x'])).toHaveLength(1)
    expect(mapLinks(undefined)).toEqual([])
  })
})

describe('mapImage', () => {
  it('maps a complete image', () => {
    expect(mapImage(validImage)).toEqual({
      assetId: 'image-abc123-1600x1000-png',
      alt: 'Rows of amber lights',
      width: 1600,
      height: 1000,
      lqip: 'data:image/jpeg;base64,xyz',
      hotspot: { x: 0.5, y: 0.4, width: 0.6, height: 0.5 },
      crop: { top: 0, bottom: 0.1, left: 0, right: 0 },
    })
  })

  it('returns null when alt text is missing or blank', () => {
    expect(mapImage({ ...validImage, alt: undefined })).toBeNull()
    expect(mapImage({ ...validImage, alt: '   ' })).toBeNull()
  })

  it('returns null without an asset or usable dimensions', () => {
    expect(mapImage({ ...validImage, asset: null })).toBeNull()
    expect(
      mapImage({ ...validImage, asset: { ...validImage.asset, metadata: { dimensions: { width: 0, height: 10 } } } }),
    ).toBeNull()
    expect(mapImage(null)).toBeNull()
    expect(mapImage('image.png')).toBeNull()
  })

  it('drops partial hotspots and crops instead of passing NaN through', () => {
    const image = mapImage({ ...validImage, hotspot: { x: 0.5 }, crop: { top: 'a' }, asset: { ...validImage.asset, metadata: { dimensions: { width: 10, height: 10 } } } })
    expect(image?.hotspot).toBeNull()
    expect(image?.crop).toBeNull()
    expect(image?.lqip).toBeNull()
  })
})

describe('mapSeo', () => {
  it('returns empty defaults for missing SEO', () => {
    expect(mapSeo(undefined)).toEqual({ title: null, description: null, ogImage: null, noindex: false })
  })

  it('only treats a real true as noindex', () => {
    expect(mapSeo({ noindex: 'true' }).noindex).toBe(false)
    expect(mapSeo({ noindex: true }).noindex).toBe(true)
  })
})
