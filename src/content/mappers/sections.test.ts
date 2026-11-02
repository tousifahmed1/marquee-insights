import { describe, expect, it } from 'vitest'

import { mapSections } from './sections'

const hero = { _key: 'h', _type: 'hero', heading: 'What audiences watch' }

describe('mapSections', () => {
  it('returns an empty list for missing or malformed sections', () => {
    for (const value of [undefined, null, 'sections', {}, 3]) {
      expect(mapSections(value)).toEqual([])
    }
  })

  it('skips unknown, missing and prototype-named block types', () => {
    const sections = mapSections([
      { _key: 'a', _type: 'carousel', heading: 'Nope' },
      { _key: 'b', heading: 'No type' },
      { _key: 'c', _type: 'constructor' },
      { _key: 'd', _type: 'toString' },
      null,
      'hero',
      hero,
    ])
    expect(sections.map((section) => section._type)).toEqual(['hero'])
  })

  it('fills in optional hero fields with null and drops broken buttons', () => {
    const [block] = mapSections([{ ...hero, primaryCta: { label: 'Go', href: 'javascript:x' } }])
    expect(block).toEqual({
      _type: 'hero',
      _key: 'h',
      eyebrow: null,
      heading: 'What audiences watch',
      subheading: null,
      primaryCta: null,
      secondaryCta: null,
      image: null,
    })
  })

  it('drops blocks missing their required content', () => {
    expect(
      mapSections([
        { _key: '1', _type: 'hero', heading: '  ' },
        { _key: '2', _type: 'featureGrid', heading: 'Empty', items: [] },
        { _key: '3', _type: 'stats', items: [{ value: '12' }] },
        { _key: '4', _type: 'quote', text: 'No author' },
        { _key: '5', _type: 'ctaBanner', heading: 'No button' },
      ]),
    ).toEqual([])
  })

  it('keeps only complete feature items and falls back to a default icon', () => {
    const [block] = mapSections([
      {
        _key: 'f',
        _type: 'featureGrid',
        items: [
          { _key: 'i1', icon: 'rocket', title: 'Reach', text: 'Who starts a title.' },
          { _key: 'i2', icon: 'tv', title: 'No text' },
          { icon: 'users', title: 'Profiles', text: 'Age and region.' },
        ],
      },
    ])
    expect(block).toMatchObject({
      _type: 'featureGrid',
      heading: '',
      items: [
        { _key: 'i1', icon: 'chart', title: 'Reach' },
        { _key: 'item-2', icon: 'users', title: 'Profiles' },
      ],
    })
  })

  it('generates keys when a section has none', () => {
    const [block] = mapSections([{ _type: 'quote', text: 'Useful.', author: 'A. Viewer' }])
    expect(block).toEqual({ _type: 'quote', _key: 'section-0', text: 'Useful.', author: 'A. Viewer', role: null })
  })
})
