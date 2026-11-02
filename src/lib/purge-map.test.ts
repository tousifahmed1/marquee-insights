import { describe, expect, it } from 'vitest'

import { ALL_URLS, affectedUrls, parsePublishedDocument } from './purge-map'

const urlsFor = (payload: Record<string, unknown>) => {
  const document = parsePublishedDocument(payload)
  if (!document) throw new Error('payload did not parse')
  return affectedUrls(document)
}

describe('parsePublishedDocument', () => {
  it('reads the webhook projection', () => {
    expect(
      parsePublishedDocument({
        _id: 'report-1',
        _type: 'report',
        operation: 'update',
        slug: 'new-slug',
        previousSlug: 'old-slug',
        from: null,
        previousFrom: null,
      }),
    ).toEqual({
      id: 'report-1',
      type: 'report',
      operation: 'update',
      slugs: ['new-slug', 'old-slug'],
      redirectSources: [],
    })
  })

  it.each([null, 'text', [], {}, { _id: 'a' }, { _type: 'report' }, { _id: '', _type: 'report' }])(
    'rejects %j',
    (payload) => {
      expect(parsePublishedDocument(payload)).toBeNull()
    },
  )

  it('ignores an unknown operation', () => {
    expect(parsePublishedDocument({ _id: 'a', _type: 'page', operation: 'x' })?.operation).toBeNull()
  })
})

describe('affectedUrls', () => {
  it('maps a report to its page, the listing and home', () => {
    expect(urlsFor({ _id: 'r', _type: 'report', slug: 'the-second-season-slump' })).toEqual([
      '/',
      '/reports',
      '/reports/the-second-season-slump',
    ])
  })

  it('includes the old URL when a report slug changes', () => {
    expect(urlsFor({ _id: 'r', _type: 'report', slug: 'new', previousSlug: 'old' })).toEqual([
      '/',
      '/reports',
      '/reports/new',
      '/reports/old',
    ])
  })

  it('uses the previous slug of a deleted report', () => {
    expect(
      urlsFor({ _id: 'r', _type: 'report', operation: 'delete', slug: null, previousSlug: 'gone' }),
    ).toEqual(['/', '/reports', '/reports/gone'])
  })

  it('maps pages to their path, and the home page to /', () => {
    expect(urlsFor({ _id: 'p', _type: 'page', slug: 'about' })).toEqual(['/about'])
    expect(urlsFor({ _id: 'p', _type: 'page', slug: 'home' })).toEqual(['/'])
  })

  it('maps site settings to every URL', () => {
    expect(urlsFor({ _id: 'siteSettings', _type: 'siteSettings' })).toEqual([ALL_URLS])
  })

  it('maps a redirect to its source paths', () => {
    expect(urlsFor({ _id: 'x', _type: 'redirect', from: '/old', previousFrom: '/older' })).toEqual([
      '/old',
      '/older',
    ])
  })

  it('returns nothing for unknown types', () => {
    expect(urlsFor({ _id: 'x', _type: 'sanity.imageAsset' })).toEqual([])
  })
})
