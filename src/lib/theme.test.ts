import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME, parseTheme } from './theme'

describe('parseTheme', () => {
  it('accepts the two known themes', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
  })

  it('falls back to the default for missing or unknown values', () => {
    expect(parseTheme(null)).toBe(DEFAULT_THEME)
    expect(parseTheme('sepia')).toBe(DEFAULT_THEME)
  })
})
