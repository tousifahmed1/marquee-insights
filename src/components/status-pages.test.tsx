import { describe, expect, it, vi } from 'vitest'

import { renderWithRouter } from '@/test/render'

import { ErrorPage } from './error-page'
import { NotFound } from './not-found'

describe('NotFound', () => {
  it('names the problem and links home and to the reports', async () => {
    const html = await renderWithRouter(<NotFound />)
    expect(html).toContain('<h1 class="mt-2 text-5xl">Page not found</h1>')
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Go to the home page<\/a>/)
    expect(html).toMatch(/<a [^>]*href="\/reports"[^>]*>Browse reports<\/a>/)
  })
})

describe('ErrorPage', () => {
  it('explains the failure, offers a retry and hides error details in production', async () => {
    vi.stubEnv('DEV', false)
    const html = await renderWithRouter(
      <ErrorPage error={new Error('secret stack detail')} reset={() => {}} />,
    )
    expect(html).toContain('Something went wrong</h1>')
    expect(html).toContain('role="alert"')
    expect(html).toMatch(/<button[^>]*>Try again<\/button>/)
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>Go to the home page<\/a>/)
    expect(html).not.toContain('secret stack detail')
    vi.unstubAllEnvs()
  })
})
