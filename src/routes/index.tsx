import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-4xl font-semibold">Marquee Insights</h1>
      <Button>Explore the data</Button>
    </main>
  )
}
