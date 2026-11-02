import type { ComponentType } from 'react'

import type { SectionBlock } from '@/content'

import type { BlockProps } from './block-props'
import { BLOCK_MAP } from './block-map'

type SectionRendererProps = {
  sections: readonly SectionBlock[]
}

function blockFor(type: unknown): ComponentType<BlockProps<SectionBlock>> | null {
  if (typeof type !== 'string' || !Object.hasOwn(BLOCK_MAP, type)) return null
  return BLOCK_MAP[type as SectionBlock['_type']] as ComponentType<BlockProps<SectionBlock>>
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  const firstHero = sections.findIndex((section) => section?._type === 'hero')
  return (
    <>
      {sections.map((section, index) => {
        const Block = section ? blockFor(section._type) : null
        if (!section || !Block) return null
        return <Block key={section._key} block={section} isPageHeading={index === firstHero} />
      })}
    </>
  )
}
