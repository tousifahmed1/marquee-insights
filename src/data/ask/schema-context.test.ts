import { describe, expect, it } from 'vitest'

import { CATALOGUE } from '../catalogue'
import { AGE_GROUPS, GENDERS, GENRES, PLATFORMS, REGIONS } from '../dimensions'

import { EXAMPLES, EXAMPLES_CONTEXT, SCHEMA_CONTEXT } from './schema-context'

// About four characters per token: the real count is `pnpm ask:tokens`.
const MAX_CHARS = 2000 * 4

describe('schema context', () => {
  it('lists every allowed value for each dimension', () => {
    for (const options of [PLATFORMS, GENRES, REGIONS, AGE_GROUPS, GENDERS]) {
      for (const option of options) expect(SCHEMA_CONTEXT).toContain(`'${option.value}'`)
    }
  })

  it('lists every show title', () => {
    for (const show of CATALOGUE) expect(SCHEMA_CONTEXT).toContain(show.title)
  })

  it('names every column and the units', () => {
    for (const column of ['show_id', 'wave', 'awareness', 'intent', 'satisfaction', 'would_recommend']) {
      expect(SCHEMA_CONTEXT).toContain(column)
    }
    expect(SCHEMA_CONTEXT).toContain('0-100')
    expect(SCHEMA_CONTEXT).toContain('1-10')
  })

  it('has six single-select examples', () => {
    expect(EXAMPLES).toHaveLength(6)
    for (const example of EXAMPLES) {
      expect(example.sql).toMatch(/^select /)
      expect(example.sql).not.toContain(';')
    }
  })

  it('stays well under the token budget', () => {
    expect(SCHEMA_CONTEXT.length + EXAMPLES_CONTEXT.length).toBeLessThan(MAX_CHARS)
  })
})
