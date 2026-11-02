import { describe, expect, it } from 'vitest'

import { parseCategory, parsePage, parseReportsInput, parseSlugInput } from './inputs'

describe('parseSlugInput', () => {
  it('accepts lowercase slugs', () => {
    expect(parseSlugInput({ slug: 'the-second-season-slump' })).toEqual({
      slug: 'the-second-season-slump',
      preview: false,
    })
  })

  it.each(['../etc', 'About', 'a--b', '-a', 'a b', '', 'x'.repeat(97), 5, null])(
    'rejects %j without querying',
    (slug) => expect(parseSlugInput({ slug }).slug).toBeNull(),
  )

  it('only enables preview for a real true', () => {
    expect(parseSlugInput({ slug: 'about', preview: 'true' }).preview).toBe(false)
    expect(parseSlugInput({ slug: 'about', preview: true }).preview).toBe(true)
    expect(parseSlugInput(undefined)).toEqual({ slug: null, preview: false })
  })
})

describe('report list inputs', () => {
  it('parses page numbers from numbers and strings', () => {
    expect(parsePage(3)).toBe(3)
    expect(parsePage('2')).toBe(2)
  })

  it.each([0, -1, 1.5, '2abc', 'NaN', 1001, null, undefined])('falls back to page 1 for %j', (page) => {
    expect(parsePage(page)).toBe(1)
  })

  it('ignores unknown categories', () => {
    expect(parseCategory('tv')).toBe('tv')
    expect(parseCategory('TV')).toBeNull()
    expect(parseReportsInput({ page: '4', category: 'radio' })).toEqual({ page: 4, category: null })
  })
})
