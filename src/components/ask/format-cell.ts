import type { Cell } from '@/data/ask/db'
import { formatValue } from '@/data/ask/template'

// Cells render the same way the answer sentence does: labels for enum values,
// "Oct 2026" for waves, thousands separators for counts.
export function formatCell(value: Cell, column = ''): string {
  return formatValue(value, column) ?? '—'
}

export function isNumericColumn(rows: readonly Record<string, Cell>[], column: string): boolean {
  return rows.length > 0 && rows.every((row) => typeof row[column] === 'number' || row[column] === null)
}

export function columnLabel(column: string): string {
  const label = column.replace(/_/g, ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}
