import type { ChartDatum, CoverStyle } from './artwork'
import type { BodyNode } from './portable-text'

export type ChartSpec = {
  id: string
  title: string
  data: ChartDatum[]
  alt: string
  caption?: string
}

export type SeedReport = {
  slug: string
  title: string
  publishedAt: string
  category: 'tv' | 'film' | 'streaming' | 'gaming' | 'sports'
  cover?: { style: CoverStyle; accent: number; alt: string }
  excerpt?: string
  seoDescription?: string
  charts?: ChartSpec[]
  body?: (chart: (id: string) => BodyNode) => (BodyNode | BodyNode[])[]
}
