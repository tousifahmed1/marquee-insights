import { createImageUrlBuilder } from '@sanity/image-url'

import { getSanityConfig } from '@/content/config'
import type { CmsImage } from '@/content'

let builder: ReturnType<typeof createImageUrlBuilder> | undefined

function getBuilder() {
  if (!builder) {
    const { projectId, dataset } = getSanityConfig()
    builder = createImageUrlBuilder({ projectId, dataset })
  }
  return builder
}

export function croppedSize(image: CmsImage) {
  const crop = image.crop
  const width = crop ? image.width * (1 - crop.left - crop.right) : image.width
  const height = crop ? image.height * (1 - crop.top - crop.bottom) : image.height
  return { width: Math.round(width), height: Math.round(height) }
}

export function imageUrl(image: CmsImage, width: number, height: number): string {
  return getBuilder()
    .image({
      asset: { _ref: image.assetId },
      crop: image.crop ?? undefined,
      hotspot: image.hotspot ?? undefined,
    })
    .width(width)
    .height(height)
    .fit('crop')
    .auto('format')
    .quality(80)
    .url()
}
