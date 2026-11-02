export const REPORT_CATEGORIES = [
  { value: 'tv', label: 'TV' },
  { value: 'film', label: 'Film' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'sports', label: 'Sports' },
] as const

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]['value']

export function isReportCategory(value: unknown): value is ReportCategory {
  return REPORT_CATEGORIES.some((category) => category.value === value)
}

export function categoryLabel(category: ReportCategory): string {
  return REPORT_CATEGORIES.find((item) => item.value === category)?.label ?? category
}
