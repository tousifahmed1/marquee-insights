import { describe, expect, it } from 'vitest'

import { parseCountUp } from './count-up'

describe('parseCountUp', () => {
  it('keeps grouping, prefix and suffix from the original text', () => {
    const count = parseCountUp('12,400')
    expect(count?.target).toBe(12400)
    expect(count?.format(0)).toBe('0')
    expect(count?.format(3456)).toBe('3,456')
    expect(parseCountUp('7 yrs')?.format(3)).toBe('3 yrs')
    expect(parseCountUp('£1,200+')?.format(1200)).toBe('£1,200+')
    expect(parseCountUp('91%')?.format(45)).toBe('45%')
  })

  it('keeps the same number of decimals', () => {
    const count = parseCountUp('4.5 hrs')
    expect(count?.target).toBe(4.5)
    expect(count?.format(2)).toBe('2.0 hrs')
  })

  it('does not group numbers that were written without commas', () => {
    expect(parseCountUp('2019')?.format(2019)).toBe('2019')
  })

  it('returns null for text without a number', () => {
    expect(parseCountUp('Weekly')).toBeNull()
    expect(parseCountUp('')).toBeNull()
  })
})
