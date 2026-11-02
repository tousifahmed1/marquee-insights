import type { AgeGroup, Gender, Genre, Platform, Region } from './dimensions'
import type { ExplorerQuery } from './filters'

export type ResponseRow = {
  id: number
  showId: number
  showTitle: string
  genre: Genre
  platform: Platform
  region: Region
  ageGroup: AgeGroup
  gender: Gender
  wave: string
  awareness: number
  intent: number
  satisfaction: number
  wouldRecommend: boolean
}

export type ResponsePage = {
  rows: ResponseRow[]
  total: number
  page: number
  pageSize: ExplorerQuery['pageSize']
  totalPages: number
}

export type GroupAverage<K extends string> = {
  key: K
  average: number | null
  responses: number
}

export type ExplorerCharts = {
  intentByPlatform: GroupAverage<Platform>[]
  awarenessByAgeGroup: GroupAverage<AgeGroup>[]
}

export type ShowOption = { id: number; title: string; genre: Genre; platform: Platform }

export type ExplorerOptions = {
  shows: ShowOption[]
  waves: string[]
}
