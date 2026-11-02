export type CountUp = {
  target: number
  format: (value: number) => string
}

const NUMBER = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/s

export function parseCountUp(text: string): CountUp | null {
  const match = NUMBER.exec(text.trim())
  if (!match) return null
  const [, prefix = '', digits = '', suffix = ''] = match
  const target = Number(digits.replaceAll(',', ''))
  if (!Number.isFinite(target)) return null
  const decimals = digits.includes('.') ? (digits.split('.')[1]?.length ?? 0) : 0
  const formatter = new Intl.NumberFormat('en-GB', {
    useGrouping: digits.includes(','),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return { target, format: (value) => `${prefix}${formatter.format(value)}${suffix}` }
}
