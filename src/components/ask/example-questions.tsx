import { Button } from '@/components/ui/button'
import { EXAMPLE_QUESTIONS } from '@/data/ask/examples'

type ExampleQuestionsProps = {
  onPick: (question: string) => void
  pending: boolean
}

// Always answered from the cache (pnpm warm:ask), so they cost nothing to try.
export function ExampleQuestions({ onPick, pending }: ExampleQuestionsProps) {
  return (
    <section aria-labelledby="ask-examples" className="mt-8">
      <h2 id="ask-examples" className="font-sans text-sm font-medium text-muted-foreground">
        Try an example
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((question) => (
          <li key={question}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal py-1.5 text-left"
              disabled={pending}
              onClick={() => onPick(question)}
            >
              {question}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
