import type { Cell, Row } from '@/data/ask/db'
import { formatInteger } from '@/lib/format'
import { cn } from '@/lib/utils'

import { columnLabel, formatCell, isNumericColumn } from './format-cell'

type ResultTableProps = {
  columns: string[]
  rows: Row[]
  rowCount: number
}

export function ResultTable({ columns, rows, rowCount }: ResultTableProps) {
  const numeric = new Map(columns.map((column) => [column, isNumericColumn(rows, column)]))
  return (
    <div
      className="mt-6 max-h-table overflow-auto overscroll-x-contain rounded-lg border focus-visible:outline-offset-2"
      tabIndex={0}
      role="region"
      aria-label="Result rows, scrollable"
    >
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          {formatInteger(rowCount)} {rowCount === 1 ? 'row' : 'rows'}
        </caption>
        <thead className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className={cn('px-3 py-2 text-left font-medium', numeric.get(column) && 'text-right')}
              >
                {columnLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t">
              {columns.map((column) => (
                <td
                  key={column}
                  className={cn('px-3 py-2', numeric.get(column) && 'text-right tabular-nums')}
                >
                  {formatCell(row[column] as Cell, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="px-3 py-6 text-center text-muted-foreground">The query returned no rows.</p>
      ) : null}
    </div>
  )
}
