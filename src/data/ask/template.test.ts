import { describe, expect, it } from 'vitest'

import { FALLBACK_ANSWER, answerFrom, fillTemplate, formatValue } from './template'

describe('fillTemplate', () => {
  it('fills placeholders from the row with labels and formatted numbers', () => {
    const row = { platform: 'lumen-plus', avg_intent: 49.8, responses: 14291 }
    expect(
      fillTemplate('{platform} leads with {avg_intent} out of 100 across {responses} responses.', row),
    ).toBe('Lumen+ leads with 49.8 out of 100 across 14,291 responses.')
  })

  it('returns null when a placeholder is missing from the row', () => {
    expect(fillTemplate('{platform} has {avg_intent}.', { platform: 'tidewell' })).toBeNull()
  })

  it('returns null when a value is null', () => {
    expect(fillTemplate('{show} scores {avg_satisfaction}.', { show: 'Varnish', avg_satisfaction: null })).toBeNull()
  })

  it('returns null without a row or with an empty template', () => {
    expect(fillTemplate('{a}', undefined)).toBeNull()
    expect(fillTemplate('   ', { a: 1 })).toBeNull()
  })

  it('leaves text without placeholders alone', () => {
    expect(fillTemplate('No one answered.', { a: 1 })).toBe('No one answered.')
  })
})

describe('answerFrom', () => {
  it('falls back to the neutral sentence for empty results', () => {
    expect(answerFrom('{show} wins.', [])).toBe(FALLBACK_ANSWER)
  })

  it('falls back when the template cannot be filled', () => {
    expect(answerFrom('{nope} wins.', [{ show: 'Varnish' }])).toBe(FALLBACK_ANSWER)
  })

  it('uses the first row', () => {
    expect(answerFrom('{show} wins.', [{ show: 'Varnish' }, { show: 'Saltgrass' }])).toBe('Varnish wins.')
  })
})

describe('formatValue', () => {
  it('shows one decimal for averages and shares even when the value is whole', () => {
    expect(formatValue(8, 'avg_satisfaction')).toBe('8.0')
    expect(formatValue(73, 'recommend_pct')).toBe('73.0')
    expect(formatValue(8, 'responses')).toBe('8')
    expect(fillTemplate('{avg_intent} out of 100', { avg_intent: 50 })).toBe('50.0 out of 100')
  })

  it('formats dates as month and year, booleans as words, and keeps unknown strings', () => {
    expect(formatValue('2026-10-01')).toBe('Oct 2026')
    expect(formatValue(true)).toBe('yes')
    expect(formatValue('male')).toBe('Male')
    expect(formatValue('Varnish')).toBe('Varnish')
    expect(formatValue(undefined)).toBeNull()
    expect(formatValue(Number.NaN)).toBeNull()
  })
})
