import type { CmsImage as CmsImageData } from '@/content'
import { croppedSize, imageUrl } from '@/lib/sanity-image'
import { cn } from '@/lib/utils'

const DEFAULT_WIDTHS = [480, 768, 1024, 1440, 1920]

type CmsImageProps = {
  image: CmsImageData
  sizes: string
  aspectRatio?: number
  widths?: number[]
  priority?: boolean
  className?: string
}

export function CmsImage({
  image,
  sizes,
  aspectRatio,
  widths = DEFAULT_WIDTHS,
  priority = false,
  className,
}: CmsImageProps) {
  const source = croppedSize(image)
  const ratio = aspectRatio ?? source.width / source.height
  const usable = widths.filter((width) => width <= source.width)
  const candidates = usable.length > 0 ? usable : [Math.min(...widths, source.width)]
  const heightFor = (width: number) => Math.round(width / ratio)
  const fallbackWidth = candidates[Math.min(2, candidates.length - 1)]

  return (
    <img
      src={imageUrl(image, fallbackWidth, heightFor(fallbackWidth))}
      srcSet={candidates
        .map((width) => `${imageUrl(image, width, heightFor(width))} ${width}w`)
        .join(', ')}
      sizes={sizes}
      width={fallbackWidth}
      height={heightFor(fallbackWidth)}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('h-auto w-full bg-muted bg-cover', className)}
      style={image.lqip ? { backgroundImage: `url(${image.lqip})` } : undefined}
    />
  )
}
