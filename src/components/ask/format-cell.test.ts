import { describe, expect, it } from 'vitest'

import { formatCell, hasDecimals, orderedByColumn } from './format-cell'

describe('format-cell', () => {
  it('shows one decimal across a column once any value has one', () => {
    const rows = [{ gap: 19.4 }, { gap: 13 }]
    expect(hasDecimals(rows, 'gap')).toBe(true)
    expect(formatCell(13, 'gap', true)).toBe('13.0')
    expect(hasDecimals([{ responses: 3 }], 'responses')).toBe(false)
    expect(formatCell(3, 'responses', false)).toBe('3')
  })

  it('finds the ORDER BY column among the result columns', () => {
    const sql = 'SELECT "s".title, round(AVG(r.awareness) - AVG(r.intent), 1) AS "gap", COUNT(*) AS "responses" FROM "responses" AS "r" GROUP BY "s".title ORDER BY gap DESC LIMIT 100'
    expect(orderedByColumn(sql, ['gap', 'responses'])).toBe('gap')
    expect(orderedByColumn('SELECT platform FROM "responses" ORDER BY "r".wave', ['avg_intent'])).toBeUndefined()
    expect(orderedByColumn('SELECT 1', ['a'])).toBeUndefined()
  })
})
