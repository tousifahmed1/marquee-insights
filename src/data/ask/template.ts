import { AGE_GROUPS, GENDERS, GENRES, PLATFORMS, REGIONS } from '../dimensions'
import type { Row } from './db'

// Fills "{column}" placeholders from the first result row. Every number in an
// answer comes from here, never from the model. Any placeholder that can't be
// filled means the neutral sentence instead, with the table still shown.

export const FALLBACK_ANSWER = "Here's what the data shows."

const PLACEHOLDER = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g

const LABELS = new Map<string, string>(
  [...PLATFORMS, ...GENRES, ...REGIONS, ...AGE_GROUPS, ...GENDERS].map((option) => [
    option.value,
    option.label,
  ]),
)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Averages, shares and rates always show one decimal, so 8.0 never reads as 8.
const DECIMAL_COLUMN = /(^|_)(avg|average|mean|pct|percent|percentage|share|rate|ratio)(_|$)/i

export function formatValue(value: unknown, column = ''): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    if (DECIMAL_COLUMN.test(column)) return value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return Number.isInteger(value) ? value.toLocaleString('en-US') : String(value)
  }
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'string') {
    const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if (date) return `${MONTHS[Number(date[2]) - 1]} ${date[1]}`
    return LABELS.get(value) ?? value
  }
  return null
}

export function fillTemplate(template: string, row: Row | undefined): string | null {
  if (!row || !template.trim()) return null
  let complete = true
  const filled = template.replace(PLACEHOLDER, (_match, name: string) => {
    const formatted = name in row ? formatValue(row[name], name) : null
    if (formatted === null) complete = false
    return formatted ?? ''
  })
  return complete ? filled : null
}

export function answerFrom(template: string, rows: Row[]): string {
  return fillTemplate(template, rows[0]) ?? FALLBACK_ANSWER
}
