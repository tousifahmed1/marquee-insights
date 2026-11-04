import { describe, expect, it } from 'vitest'

import type { Answer, Refusal } from '@/data/ask/pipeline'
import { renderWithRouter } from '@/test/render'

import { AskResult } from './ask-result'

const answer: Answer = {
  status: 'answered',
  question: 'How many responses?',
  sql: 'SELECT COUNT(*) AS "responses" FROM "responses"',
  answer: 'There are 50,000 responses.',
  template: 'There are {responses} responses.',
  chart: 'none',
  columns: ['responses'],
  rows: [{ responses: 50000 }],
  rowCount: 1,
  provider: 'gemini',
  cached: true,
  modelCalls: 0,
  timings: { model: 0, query: 0, total: 4 },
}

const refusal: Refusal = {
  status: 'refused',
  question: 'Next month?',
  reason: 'The survey has no future data.',
  provider: 'groq',
  cached: false,
  modelCalls: 1,
  timings: { model: 400, query: 0, total: 410 },
}

describe('AskResult', () => {
  it('shows a loading card with the question while a request runs', async () => {
    const html = await renderWithRouter(
      <AskResult question="How many responses?" pending failed={false} outcome={undefined} />,
    )
    expect(html).toContain('aria-busy')
    expect(html).toContain('role="status"')
    expect(html).toContain('Asking the data…')
    expect(html).toContain('How many responses?')
  })

  it('renders the answer, the cached badge and the SQL panel', async () => {
    const html = await renderWithRouter(
      <AskResult question="How many responses?" pending={false} failed={false} outcome={answer} />,
    )
    expect(html).toContain('There are 50,000 responses.')
    expect(html).toContain('>cached<')
    expect(html).toMatch(/answered in (<!-- -->)?4 ms/)
    expect(html).toContain('Show SQL')
    expect(html).toContain('SELECT COUNT(*) AS &quot;responses&quot;')
  })

  it('renders a refusal with its reason and nothing before a question is asked', async () => {
    const refused = await renderWithRouter(
      <AskResult question="Next month?" pending={false} failed={false} outcome={refusal} />,
    )
    expect(refused).toContain('The data can’t answer that.')
    expect(refused).toContain('The survey has no future data.')
    const empty = await renderWithRouter(
      <AskResult question="" pending={false} failed={false} outcome={undefined} />,
    )
    expect(empty).not.toContain('role="status"')
  })

  it('shows the network failure card', async () => {
    const html = await renderWithRouter(
      <AskResult question="q" pending={false} failed outcome={undefined} />,
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain('Something went wrong.')
  })
})
