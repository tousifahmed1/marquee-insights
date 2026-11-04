import type { NewResponse } from '../../src/data/schema'
import type { AgeGroup, Gender, Genre, Platform, Region } from '../../src/data/dimensions'
import { AGE_GROUPS, GENDERS, REGIONS, values } from '../../src/data/dimensions'

import type { CatalogueShow } from '../../src/data/catalogue'
import type { Random } from './random'
import { clamp } from './random'

export const WAVE_COUNT = 12

const REGION_VALUES = values(REGIONS)
const AGE_VALUES = values(AGE_GROUPS)
const GENDER_VALUES = values(GENDERS)

const REGION_WEIGHTS = [17, 21, 38, 24]
const AGE_WEIGHTS = [14, 22, 20, 18, 26]
const GENDER_WEIGHTS = [49, 47, 2.5, 1.5]

const GENRE_AGE_APPEAL: Record<Genre, readonly number[]> = {
  drama: [0.8, 0.9, 1, 1.15, 1.2],
  comedy: [1.25, 1.15, 1, 0.9, 0.8],
  thriller: [0.9, 1.1, 1.15, 1, 0.9],
  'sci-fi': [1.3, 1.25, 1, 0.8, 0.6],
  crime: [0.6, 0.85, 1.1, 1.25, 1.35],
  documentary: [0.6, 0.8, 1, 1.25, 1.4],
  reality: [1.5, 1.3, 1, 0.75, 0.6],
  animation: [1.2, 1.35, 1.15, 0.7, 0.5],
}

const PLATFORM_REGION_LIFT: Record<Platform, readonly number[]> = {
  'lumen-plus': [4, 0, -2, 3],
  tidewell: [0, -3, -1, 7],
  'corvid-tv': [-2, 6, 3, -5],
  quaystream: [2, -2, 0, 4],
  harbourline: [9, 1, -4, -1],
  'parcel-play': [-3, 2, 7, -2],
}

const PLATFORM_AGE_LIFT: Record<Platform, readonly number[]> = {
  'lumen-plus': [6, 5, 2, -3, -8],
  tidewell: [3, 4, 2, -1, -5],
  'corvid-tv': [-9, -5, 0, 4, 8],
  quaystream: [9, 6, 1, -5, -10],
  harbourline: [-4, -2, 1, 3, 4],
  'parcel-play': [2, 1, 0, 0, -2],
}

export type ShowProfile = CatalogueShow & {
  id: number
  popularity: number
  baseAwareness: number
  quality: number
  launchDeficit: number
  awarenessTrend: number
  qualityTrend: number
  premiereWave: number
}

export function profileShows(
  shows: readonly (CatalogueShow & { id: number })[],
  random: Random,
  waves: readonly string[],
): ShowProfile[] {
  return shows.map((show, rank) => {
    const popularity = 1 / Math.pow(rank + 1, 0.85)
    const firstWave = waves.findIndex((wave) => Number(wave.slice(0, 4)) >= show.releaseYear)
    if (firstWave === -1) throw new Error(`${show.title} is released after the last wave`)
    const isNew = firstWave > 0
    return {
      ...show,
      popularity,
      baseAwareness: clamp(28 + 52 * Math.sqrt(popularity) + random.normal(0, 5), 15, 88),
      quality: clamp(random.normal(6.8, 0.8), 5, 8.8),
      launchDeficit: isNew ? random.normal(22, 4) : 0,
      awarenessTrend: isNew ? random.normal(2.6, 0.5) : random.normal(-0.2, 0.5),
      qualityTrend: random.normal(0, 0.05),
      premiereWave: isNew
        ? firstWave + Math.floor(random.next() * Math.min(6, waves.length - firstWave))
        : 0,
    }
  })
}

export function lastWaves(today: Date, count = WAVE_COUNT): string[] {
  const waves: string[] = []
  for (let offset = count; offset >= 1; offset--) {
    const month = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1))
    waves.push(month.toISOString().slice(0, 10))
  }
  return waves
}

function ageWeightsFor(genre: Genre): number[] {
  return AGE_WEIGHTS.map((weight, i) => weight * (GENRE_AGE_APPEAL[genre][i] ?? 1))
}

export function generateResponses(
  shows: readonly ShowProfile[],
  waves: readonly string[],
  total: number,
  random: Random,
): NewResponse[] {
  const waveWeights = waves.map((_, i) => 1 + i * 0.015)
  const waveTotal = waveWeights.reduce((sum, weight) => sum + weight, 0)
  const ageWeights = new Map(shows.map((show) => [show.id, ageWeightsFor(show.genre)]))
  const rows: NewResponse[] = []

  waves.forEach((wave, waveIndex) => {
    const live = shows.filter((show) => show.premiereWave <= waveIndex)
    const liveWeights = live.map((show) => show.popularity)
    const count =
      waveIndex === waves.length - 1
        ? total - rows.length
        : Math.round((total * (waveWeights[waveIndex] ?? 1)) / waveTotal)

    for (let i = 0; i < count; i++) {
      const show = random.weighted(live, liveWeights)
      const region = random.weighted(REGION_VALUES, REGION_WEIGHTS) as Region
      const ageGroup = random.weighted(AGE_VALUES, ageWeights.get(show.id) ?? AGE_WEIGHTS) as AgeGroup
      const gender = random.weighted(GENDER_VALUES, GENDER_WEIGHTS) as Gender
      rows.push(scoreResponse(show, wave, waveIndex, region, ageGroup, gender, random))
    }
  })

  return rows
}

function scoreResponse(
  show: ShowProfile,
  wave: string,
  waveIndex: number,
  region: Region,
  ageGroup: AgeGroup,
  gender: Gender,
  random: Random,
): NewResponse {
  const regionIndex = REGION_VALUES.indexOf(region)
  const ageIndex = AGE_VALUES.indexOf(ageGroup)
  const appeal = GENRE_AGE_APPEAL[show.genre][ageIndex] ?? 1
  const wavesLive = waveIndex - show.premiereWave

  const awareness = clamp(
    show.baseAwareness -
      show.launchDeficit +
      show.awarenessTrend * wavesLive +
      (PLATFORM_REGION_LIFT[show.platform][regionIndex] ?? 0) +
      (PLATFORM_AGE_LIFT[show.platform][ageIndex] ?? 0) +
      random.normal(0, 14),
    0,
    100,
  )

  const intent = clamp(
    0.55 * awareness + 30 * (appeal - 1) + 12 + random.normal(0, 13),
    0,
    100,
  )

  const satisfaction = clamp(
    Math.round(
      show.quality + show.qualityTrend * waveIndex + 1.6 * (appeal - 1) + random.normal(0, 1.5),
    ),
    1,
    10,
  )

  const recommendOdds = 1.1 * (satisfaction - 6.5) + 0.02 * (intent - 50)

  return {
    showId: show.id,
    platform: show.platform,
    region,
    ageGroup,
    gender,
    wave,
    awareness: Math.round(awareness),
    intent: Math.round(intent),
    satisfaction,
    wouldRecommend: random.next() < 1 / (1 + Math.exp(-recommendOdds)),
  }
}
