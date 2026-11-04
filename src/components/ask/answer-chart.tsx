import { useId } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { Cell, Row } from '@/data/ask/db'
import type { ChartKind } from '@/data/ask/reply'

import { columnLabel, formatCell, isNumericColumn, orderedByColumn } from './format-cell'

type AnswerChartProps = {
  kind: Exclude<ChartKind, 'none'>
  columns: string[]
  rows: Row[]
  sql: string
}

type Plot = { label: string; value: number }

const SSR_SIZE = { width: 480, height: 256 }
const MAX_BARS = 40

// The category is the first non-numeric column. The value is the numeric
// column the SQL orders by, else the first numeric column that is not a count,
// else the count.
export function pickChartColumns(columns: string[], rows: Row[], sql = '') {
  const category = columns.find((column) => !isNumericColumn(rows, column))
  const numeric = columns.filter((column) => isNumericColumn(rows, column))
  const ordered = orderedByColumn(sql, numeric)
  const value = ordered ?? numeric.find((column) => !/^(responses|count|n|total)$/i.test(column)) ?? numeric[0]
  return category && value ? { category, value } : null
}

function ChartTooltip({ active, payload, measure, valueColumn }: { active?: boolean; payload?: readonly { payload?: unknown }[]; measure: string; valueColumn: string }) {
  const datum = payload?.[0]?.payload as Plot | undefined
  if (!active || !datum) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{datum.label}</p>
      <p className="mt-1 tabular-nums">
        {measure} {formatCell(datum.value, valueColumn)}
      </p>
    </div>
  )
}

export function AnswerChart({ kind, columns, rows, sql }: AnswerChartProps) {
  const id = useId()
  const picked = pickChartColumns(columns, rows, sql)
  if (!picked || rows.length < 2 || rows.length > MAX_BARS) return null
  const plot: Plot[] = rows
    .filter((row) => typeof row[picked.value] === 'number')
    .map((row) => ({ label: formatCell(row[picked.category] as Cell), value: row[picked.value] as number }))
  const measure = columnLabel(picked.value)
  const horizontal = kind === 'bar' && plot.length > 6

  return (
    <figure className="mt-6 rounded-lg border bg-card p-5" aria-hidden>
      <figcaption className="text-sm text-muted-foreground">
        {measure} by {columnLabel(picked.category).toLowerCase()}
      </figcaption>
      <div className="chart-frame mt-4 h-chart">
        <ResponsiveContainer width="100%" height="100%" initialDimension={SSR_SIZE}>
          {kind === 'line' ? (
            <LineChart id={id} data={plot} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis width={40} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip measure={measure} valueColumn={picked.value} />} />
              <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          ) : (
            <BarChart
              id={id}
              data={plot}
              layout={horizontal ? 'vertical' : 'horizontal'}
              margin={horizontal ? { top: 4, right: 24, bottom: 4, left: 8 } : { top: 8, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid horizontal={!horizontal} vertical={horizontal} />
              <XAxis
                type={horizontal ? 'number' : 'category'}
                dataKey={horizontal ? undefined : 'label'}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type={horizontal ? 'category' : 'number'}
                dataKey={horizontal ? 'label' : undefined}
                width={horizontal ? 150 : 40}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<ChartTooltip measure={measure} valueColumn={picked.value} />} />
              <Bar dataKey="value" fill="var(--chart-1)" maxBarSize={48} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
