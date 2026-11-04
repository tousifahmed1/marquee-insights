import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { AskForm } from '@/components/ask/ask-form'
import { AskResult } from '@/components/ask/ask-result'
import { ExampleQuestions } from '@/components/ask/example-questions'
import { useTurnstile } from '@/components/ask/use-turnstile'
import { Container } from '@/components/container'
import { Section } from '@/components/section'
import { askTheData } from '@/data/ask/functions'
import type { AskInput } from '@/data/ask/functions'
import { cacheHeaders } from '@/lib/cache-control'
import { resolveSeo, seoHead } from '@/lib/seo'

export const Route = createFileRoute('/ask')({
  head: ({ match }) =>
    seoHead(
      resolveSeo(match.context.siteSettings, {
        title: 'Ask the data',
        path: '/ask',
        description:
          'Ask a question about the survey in plain English. An AI model writes the SQL, we check it and run it read-only, and show the answer next to the query.',
      }),
    ),
  headers: () => cacheHeaders('noStore'),
  component: AskPage,
})

function AskPage() {
  const [draft, setDraft] = useState('')
  const [asked, setAsked] = useState('')
  // True from the moment of submit, including the wait for a Turnstile token
  // before the request itself starts.
  const [submitting, setSubmitting] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const turnstile = useTurnstile(import.meta.env.VITE_TURNSTILE_SITE_KEY)
  const mutation = useMutation({
    mutationFn: (data: AskInput) => askTheData({ data }),
  })
  const pending = submitting || mutation.isPending

  // Bring the loading card into view as soon as a question is sent.
  useEffect(() => {
    if (!pending) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [pending])

  // One request at a time; a second submit while one is in flight is ignored.
  const submit = async (question: string, example: boolean) => {
    const trimmed = question.trim()
    if (!trimmed || pending) return
    setSubmitting(true)
    setDraft(trimmed)
    setAsked(trimmed)
    try {
      const turnstileToken = example ? undefined : await turnstile.getToken()
      const outcome = await mutation.mutateAsync({ question: trimmed, turnstileToken })
      // A token is spent once it reaches the server's check; cache hits never do.
      if (!example && !('cached' in outcome && outcome.cached)) turnstile.reset()
    } catch {
      if (!example) turnstile.reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section className="pt-12">
      <Container width="prose">
        <h1 className="text-5xl">Ask the data</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Ask a question about the 50,000 survey responses in plain English. An AI model writes
          one SQL query, we check it, run it read-only, and show you the answer with the query
          beside it.
        </p>
        <AskForm
          question={draft}
          onChange={setDraft}
          onSubmit={() => void submit(draft, false)}
          pending={pending}
          turnstileContainer={turnstile.container}
        />
      </Container>
      <Container width="page">
        <div ref={resultRef} className="mx-auto max-w-4xl scroll-mt-24 empty:hidden [&:not(:empty)]:mt-10" aria-live="polite">
          <AskResult question={asked} pending={pending} failed={mutation.isError} outcome={mutation.data} />
        </div>
      </Container>
      <Container width="prose">
        <ExampleQuestions onPick={(question) => void submit(question, true)} pending={pending} />
      </Container>
    </Section>
  )
}
