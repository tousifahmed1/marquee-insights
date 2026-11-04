import { describe, expect, it } from 'vitest'

import { parseReply } from './reply'

const good = {
  answerable: true,
  sql: 'select count(*) as responses from responses;',
  answer_template: '{responses} responses.',
  chart: 'none',
  reason: '',
}

describe('parseReply', () => {
  it('parses a reply and strips a trailing semicolon', () => {
    expect(parseReply(JSON.stringify(good))?.sql).toBe('select count(*) as responses from responses')
  })

  it('accepts a fenced JSON block', () => {
    expect(parseReply('```json\n' + JSON.stringify(good) + '\n```')?.answerable).toBe(true)
  })

  it('rejects non-JSON, missing fields and unknown chart kinds', () => {
    expect(parseReply('not json')).toBeNull()
    expect(parseReply(JSON.stringify({ ...good, chart: 'pie' }))).toBeNull()
    expect(parseReply(JSON.stringify({ answerable: true }))).toBeNull()
  })
})
