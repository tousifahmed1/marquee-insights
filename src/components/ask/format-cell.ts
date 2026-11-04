import type { Cell } from '@/data/ask/db'
import { formatValue } from '@/data/ask/template'

// Cells render the same way the answer sentence does: labels for enum values,
// "Oct 2026" for waves, thousands separators for counts.
export function formatCell(value: Cell, column = '', decimals = false): string {
  return formatValue(value, column, decimals) ?? '—'
}

export function isNumericColumn(rows: readonly Record<string, Cell>[], column: string): boolean {
  return rows.length > 0 && rows.every((row) => typeof row[column] === 'number' || row[column] === null)
}

// A column with any fractional value shows one decimal in every row, so a
// computed gap of 13 lines up with 19.4 above it.
export function hasDecimals(rows: readonly Record<string, Cell>[], column: string): boolean {
  return rows.some((row) => typeof row[column] === 'number' && !Number.isInteger(row[column]))
}

// The column the SQL orders by, when it is one of the result columns: the
// best guess at what the question was about.
export function orderedByColumn(sql: string, columns: readonly string[]): string | undefined {
  const match = /\border by\s+"?([a-z_][a-z0-9_]*)"?/i.exec(sql)
  const name = match?.[1]
  return name && columns.includes(name) ? name : undefined
}

export function columnLabel(column: string): string {
  const label = column.replace(/_/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}
