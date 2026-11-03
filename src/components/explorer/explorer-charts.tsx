import { useId } from 'react'

import { AGE_GROUPS, PLATFORMS, labelFor } from '@/data/dimensions'
import type { ExplorerCharts as ChartsData } from '@/data/types'
import { formatAverage, formatInteger } from '@/lib/format'

import { AverageBarChart } from './bar-chart'
import type { ChartDatum } from './bar-chart'
import { LoadError } from './inline-states'

type ExplorerChartsProps = {
  charts: ChartsData | undefined
  error: boolean
  onRetry: () => void
}

function ChartCard({
  title,
  description,
  measure,
  data,
  orientation,
  color,
}: {
  title: string
  description: string
  measure: string
  data: ChartDatum[]
  orientation: 'horizontal' | 'vertical'
  color: string
}) {
  const id = useId()
  return (
    <figure aria-labelledby={`${id}-title`} className="rounded-lg border bg-card p-5">
      <figcaption>
        <h2 id={`${id}-title`} className="font-sans text-base font-medium">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </figcaption>
      <div className="mt-4" aria-hidden>
        <AverageBarChart data={data} measure={measure} orientation={orientation} color={color} />
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Group</th>
            <th scope="col">{measure}</th>
            <th scope="col">Responses</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.key}>
              <th scope="row">{datum.label}</th>
              <td>{datum.average === null ? 'No responses' : formatAverage(datum.average)}</td>
              <td>{formatInteger(datum.responses)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export function ExplorerCharts({ charts, error, onRetry }: ExplorerChartsProps) {
  if (!charts) return error ? <LoadError what="The charts" onRetry={onRetry} /> : null
  const hasData = charts.intentByPlatform.some((group) => group.responses > 0)
  if (!hasData) return null

  return (
    <section aria-label="Charts" className="grid gap-6 xl:grid-cols-2">
      <ChartCard
        title="Intent to watch by platform"
        description="Average intent-to-watch score, 0 to 100, highest first"
        measure="Average intent to watch"
        orientation="horizontal"
        color="var(--chart-1)"
        data={charts.intentByPlatform.map((group) => ({
          ...group,
          label: labelFor(PLATFORMS, group.key),
        }))}
      />
      <ChartCard
        title="Awareness by age group"
        description="Average awareness score, 0 to 100"
        measure="Average awareness"
        orientation="vertical"
        color="var(--chart-2)"
        data={charts.awarenessByAgeGroup.map((group) => ({
          ...group,
          label: labelFor(AGE_GROUPS, group.key),
        }))}
      />
    </section>
  )
}
