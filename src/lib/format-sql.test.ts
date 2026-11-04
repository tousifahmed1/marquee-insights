import { describe, expect, it } from 'vitest'

import { formatSql } from './format-sql'

describe('formatSql', () => {
  it('breaks top-level clauses onto their own lines and leaves subqueries alone', () => {
    const sql =
      `SELECT "r".wave, round(AVG("r".awareness), 1) AS "avg_awareness" FROM "responses" AS "r" INNER JOIN "shows" AS "s" ON "s".id = "r".show_id WHERE "s".title = 'Night Ferry to Osk' AND "r".wave > (SELECT MAX(wave) FROM "responses") - INTERVAL '6 months' GROUP BY "r".wave ORDER BY "r".wave ASC LIMIT 100`
    expect(formatSql(sql).split('\n')).toEqual([
      'SELECT "r".wave, round(AVG("r".awareness), 1) AS "avg_awareness"',
      'FROM "responses" AS "r"',
      'INNER JOIN "shows" AS "s" ON "s".id = "r".show_id',
      `WHERE "s".title = 'Night Ferry to Osk' AND "r".wave > (SELECT MAX(wave) FROM "responses") - INTERVAL '6 months'`,
      'GROUP BY "r".wave',
      'ORDER BY "r".wave ASC',
      'LIMIT 100',
    ])
  })

  it('ignores clause words inside string literals', () => {
    expect(formatSql(`SELECT title FROM "shows" WHERE title = 'From Where'`)).toBe(
      `SELECT title\nFROM "shows"\nWHERE title = 'From Where'`,
    )
  })
})
