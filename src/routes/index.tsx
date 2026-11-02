import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto max-w-page px-gutter py-section">
      <h1 className="mb-6 text-6xl">Marquee Insights</h1>
      <p className="mb-10 max-w-prose text-lg text-muted-foreground">
        Audience research for film, television and streaming. We measure what
        people watch, why they stay and what brings them back.
      </p>
      <div className="mb-16 flex flex-wrap gap-3">
        <Button size="lg">Explore the data</Button>
        <Button size="lg" variant="outline">
          Read the reports
        </Button>
      </div>
      <Card className="max-w-prose">
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            Weekly viewing panel
          </CardTitle>
          <CardDescription>
            12,400 respondents across four regions, refreshed every Monday.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search shows, platforms or genres" />
        </CardContent>
      </Card>
    </main>
  )
}
