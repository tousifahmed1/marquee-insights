import { useRouter } from '@tanstack/react-router'

import { Container } from '@/components/container'
import { Section } from '@/components/section'
import { Button } from '@/components/ui/button'

export function ExplorerError() {
  const router = useRouter()
  return (
    <Section>
      <Container width="prose">
        <h1 className="text-5xl">Audience explorer</h1>
        <div role="alert" className="mt-8 space-y-4">
          <p className="text-lg">
            The survey data didn’t load. The database may be waking up, which takes a few seconds.
          </p>
          <Button onClick={() => void router.invalidate()}>Try again</Button>
        </div>
      </Container>
    </Section>
  )
}
