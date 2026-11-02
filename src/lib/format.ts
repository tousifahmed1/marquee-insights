const integer = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const monthLong = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatInteger(value: number): string {
  return integer.format(value)
}

export function formatAverage(value: number): string {
  return oneDecimal.format(value)
}

function monthDate(month: string): Date | null {
  const match = /^(\d{4})-(\d{2})/.exec(month)
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)) : null
}

export function formatMonth(month: string, style: 'long' | 'short' = 'long'): string {
  const date = monthDate(month)
  if (!date) return month
  return (style === 'long' ? monthLong : monthShort).format(date)
}
