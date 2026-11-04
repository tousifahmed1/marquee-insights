import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

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
  const turnstile = useTurnstile(import.meta.env.VITE_TURNSTILE_SITE_KEY)
  const mutation = useMutation({
    mutationFn: (data: AskInput) => askTheData({ data }),
  })

  // One request at a time; a second submit while one is in flight is ignored.
  const submit = async (question: string, example: boolean) => {
    const trimmed = question.trim()
    if (!trimmed || mutation.isPending) return
    setDraft(trimmed)
    setAsked(trimmed)
    const turnstileToken = example ? undefined : await turnstile.getToken()
    try {
      const outcome = await mutation.mutateAsync({ question: trimmed, turnstileToken })
      // A token is spent once it reaches the server's check; cache hits never do.
      if (!example && !('cached' in outcome && outcome.cached)) turnstile.reset()
    } catch {
      if (!example) turnstile.reset()
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
          pending={mutation.isPending}
          turnstileContainer={turnstile.container}
        />
        <ExampleQuestions onPick={(question) => void submit(question, true)} pending={mutation.isPending} />
      </Container>
      <Container className="mt-10" width="page">
        <div className="mx-auto max-w-4xl" aria-live="polite">
          <AskResult
            question={asked}
            pending={mutation.isPending}
            failed={mutation.isError}
            outcome={mutation.data}
          />
        </div>
      </Container>
    </Section>
  )
}
