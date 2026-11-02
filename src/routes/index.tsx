import { Link, createFileRoute } from '@tanstack/react-router'

import { Container } from '@/components/container'
import { Section } from '@/components/section'
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

const LATEST_REPORTS = [
  {
    date: '2026-10-27',
    label: '27 October 2026',
    title: 'The second-season slump',
    summary:
      'Why a third of viewers drift away from returning series by episode four, and what brings them back.',
  },
  {
    date: '2026-10-13',
    label: '13 October 2026',
    title: 'Weekly drops against the binge',
    summary:
      'Release cadence across eleven streaming platforms, and how it shapes completion and word of mouth.',
  },
  {
    date: '2026-09-29',
    label: '29 September 2026',
    title: 'Comfort viewing in a crowded autumn',
    summary:
      'Rewatching rose for the third year running. We look at who rewatches, what, and when.',
  },
]

function Home() {
  return (
    <>
      <Section>
        <Container>
          <h1 className="max-w-4xl text-6xl">
            What audiences watch, and why they stay.
          </h1>
          <p className="mt-8 max-w-prose text-lg text-muted-foreground">
            Marquee Insights runs a weekly panel of 12,400 viewers across film,
            television and streaming. Studios and platforms use our research to
            decide what to make, when to release it and who it is for.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/explore">Explore the data</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/reports">Read the reports</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="muted" aria-labelledby="latest-reports">
        <Container>
          <h2 id="latest-reports" className="text-4xl">
            Latest reports
          </h2>
          <ul className="mt-10 border-t">
            {LATEST_REPORTS.map((report) => (
              <li
                key={report.date}
                className="grid gap-2 border-b py-8 md:grid-cols-[12rem_1fr] md:gap-10"
              >
                <time dateTime={report.date} className="text-sm text-muted-foreground">
                  {report.label}
                </time>
                <div>
                  <h3 className="text-2xl">{report.title}</h3>
                  <p className="mt-2 max-w-prose text-muted-foreground">
                    {report.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section aria-labelledby="explore-panel">
        <Container className="grid items-start gap-10 md:grid-cols-2">
          <div>
            <h2 id="explore-panel" className="text-4xl">
              Ask the panel your own question
            </h2>
            <p className="mt-6 max-w-prose text-muted-foreground">
              Filter every survey wave by age, region, platform and genre. Each
              view has its own link, so you can share exactly what you found.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl font-normal">
                Weekly viewing panel
              </CardTitle>
              <CardDescription>
                12,400 respondents across four regions, refreshed every Monday.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                aria-label="Search shows, platforms or genres"
                placeholder="Search shows, platforms or genres"
              />
            </CardContent>
          </Card>
        </Container>
      </Section>
    </>
  )
}
