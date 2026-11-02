import type { ComponentType } from 'react'

import type { SectionBlock } from '@/content'

import type { BlockProps } from './block-props'
import { CtaBanner } from './cta-banner'
import { FeatureGrid } from './feature-grid'
import { Hero } from './hero'
import { Quote } from './quote'
import { Stats } from './stats'

type BlockMap = {
  [Type in SectionBlock['_type']]: ComponentType<
    BlockProps<Extract<SectionBlock, { _type: Type }>>
  >
}

export const BLOCK_MAP: BlockMap = {
  hero: Hero,
  featureGrid: FeatureGrid,
  stats: Stats,
  quote: Quote,
  ctaBanner: CtaBanner,
}
