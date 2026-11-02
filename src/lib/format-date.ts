const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`))
}
