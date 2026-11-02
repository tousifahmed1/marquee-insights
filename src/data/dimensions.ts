export const PLATFORMS = [
  { value: 'lumen-plus', label: 'Lumen+' },
  { value: 'tidewell', label: 'Tidewell' },
  { value: 'corvid-tv', label: 'Corvid TV' },
  { value: 'quaystream', label: 'Quaystream' },
  { value: 'harbourline', label: 'Harbourline' },
  { value: 'parcel-play', label: 'Parcel Play' },
] as const

export const GENRES = [
  { value: 'drama', label: 'Drama' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'sci-fi', label: 'Sci-fi' },
  { value: 'crime', label: 'Crime' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'reality', label: 'Reality' },
  { value: 'animation', label: 'Animation' },
] as const

export const REGIONS = [
  { value: 'northeast', label: 'Northeast' },
  { value: 'midwest', label: 'Midwest' },
  { value: 'south', label: 'South' },
  { value: 'west', label: 'West' },
] as const

export const AGE_GROUPS = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
] as const

export const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'undisclosed', label: 'Prefer not to say' },
] as const

type Option = { readonly value: string; readonly label: string }

export type Platform = (typeof PLATFORMS)[number]['value']
export type Genre = (typeof GENRES)[number]['value']
export type Region = (typeof REGIONS)[number]['value']
export type AgeGroup = (typeof AGE_GROUPS)[number]['value']
export type Gender = (typeof GENDERS)[number]['value']

export function values<const T extends readonly Option[]>(options: T) {
  return options.map((option) => option.value) as unknown as {
    [K in keyof T]: T[K]['value']
  }
}

export function labelFor(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}
