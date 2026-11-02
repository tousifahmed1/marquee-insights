import { useId } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatAverage, formatInteger } from '@/lib/format'

export type ChartDatum = {
  key: string
  label: string
  average: number | null
  responses: number
}

type PlotDatum = ChartDatum & { value: number; valueLabel: string }

type AverageBarChartProps = {
  data: readonly ChartDatum[]
  measure: string
  orientation: 'horizontal' | 'vertical'
  color: string
}

const SSR_SIZE = { width: 480, height: 256 }
const TICKS = [0, 25, 50, 75, 100]

function ChartTooltip({
  active,
  payload,
  measure,
}: {
  active?: boolean
  payload?: readonly { payload?: unknown }[]
  measure: string
}) {
  const datum = payload?.[0]?.payload as PlotDatum | undefined
  if (!active || !datum) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{datum.label}</p>
      <p className="mt-1 tabular-nums">
        {datum.average === null ? 'No responses' : `${measure} ${formatAverage(datum.average)}`}
      </p>
      {datum.average === null ? null : (
        <p className="text-muted-foreground tabular-nums">
          {formatInteger(datum.responses)} responses
        </p>
      )}
    </div>
  )
}

export function AverageBarChart({ data, measure, orientation, color }: AverageBarChartProps) {
  const plot: PlotDatum[] = data.map((datum) => ({
    ...datum,
    value: datum.average ?? 0,
    valueLabel: datum.average === null ? 'No data' : formatAverage(datum.average),
  }))
  const horizontal = orientation === 'horizontal'
  const id = useId()

  return (
    <div className="chart-frame h-chart">
      <ResponsiveContainer width="100%" height="100%" initialDimension={SSR_SIZE}>
        <BarChart
          id={id}
          data={plot}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal ? { top: 4, right: 48, bottom: 4, left: 8 } : { top: 24, right: 8, bottom: 4, left: 0 }}
        >
          <CartesianGrid horizontal={!horizontal} vertical={horizontal} />
          <XAxis
            type={horizontal ? 'number' : 'category'}
            dataKey={horizontal ? undefined : 'label'}
            domain={horizontal ? [0, 100] : undefined}
            ticks={horizontal ? TICKS : undefined}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type={horizontal ? 'category' : 'number'}
            dataKey={horizontal ? 'label' : undefined}
            domain={horizontal ? undefined : [0, 100]}
            ticks={horizontal ? undefined : TICKS}
            width={horizontal ? 96 : 32}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
            content={<ChartTooltip measure={measure} />}
          />
          <Bar
            dataKey="value"
            fill={color}
            maxBarSize={24}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            isAnimationActive={false}
          >
            <LabelList dataKey="valueLabel" position={horizontal ? 'right' : 'top'} offset={6} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
