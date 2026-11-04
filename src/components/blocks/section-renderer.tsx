import { Fragment } from 'react'
import type { ComponentType, ReactNode } from 'react'

import { Reveal } from '@/components/motion/reveal'
import type { SectionBlock } from '@/content'

import type { BlockProps } from './block-props'
import { BLOCK_MAP } from './block-map'

// Heroes sit above the fold, and stats are animated by the home page scroll
// moment, which pins them and so cannot sit inside a transformed wrapper.
const REVEALED_BLOCKS = new Set<SectionBlock['_type']>(['featureGrid', 'quote', 'ctaBanner'])

type SectionRendererProps = {
  sections: readonly SectionBlock[]
  heroAside?: ReactNode
}

function blockFor(type: unknown): ComponentType<BlockProps<SectionBlock>> | null {
  if (typeof type !== 'string' || !Object.hasOwn(BLOCK_MAP, type)) return null
  return BLOCK_MAP[type as SectionBlock['_type']] as ComponentType<BlockProps<SectionBlock>>
}

export function SectionRenderer({ sections, heroAside }: SectionRendererProps) {
  const firstHero = sections.findIndex((section) => section?._type === 'hero')
  return (
    <>
      {sections.map((section, index) => {
        const Block = section ? blockFor(section._type) : null
        if (!section || !Block) return null
        const isPageHeading = index === firstHero
        const block = (
          <Block block={section} isPageHeading={isPageHeading} aside={isPageHeading ? heroAside : undefined} />
        )
        return REVEALED_BLOCKS.has(section._type) ? (
          <Reveal key={section._key}>{block}</Reveal>
        ) : (
          <Fragment key={section._key}>{block}</Fragment>
        )
      })}
    </>
  )
}
