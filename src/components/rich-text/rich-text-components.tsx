import type { PortableTextComponents } from '@portabletext/react'

import { CmsImage } from '@/components/cms-image'
import { CmsLink } from '@/components/cms-link'
import type { RichTextImage, RichTextPullQuote } from '@/content'
import { safeHref } from '@/content/mappers/primitives'

export const richTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mt-6 text-lg">{children}</p>,
    h2: ({ children }) => <h2 className="mt-14 text-3xl">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-10 text-2xl">{children}</h3>,
    h4: ({ children }) => (
      <h4 className="mt-8 font-sans text-lg font-semibold">{children}</h4>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-6 list-disc space-y-2 pl-6 text-lg marker:text-primary">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-6 list-decimal space-y-2 pl-6 text-lg marker:text-primary">{children}</ol>
    ),
  },
  listItem: ({ children }) => <li className="pl-2">{children}</li>,
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }) => {
      const href = safeHref((value as { href?: unknown } | undefined)?.href)
      if (!href) return <>{children}</>
      return (
        <CmsLink
          href={href}
          className="text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          {children}
        </CmsLink>
      )
    },
  },
  types: {
    image: ({ value }: { value: RichTextImage }) => (
      <figure className="my-12">
        <CmsImage
          image={value.image}
          sizes="(min-width: 48rem) 40rem, 100vw"
          widths={[480, 640, 960, 1280]}
          className="rounded-md"
        />
        {value.caption ? (
          <figcaption className="mt-3 text-sm text-muted-foreground">{value.caption}</figcaption>
        ) : null}
      </figure>
    ),
    pullQuote: ({ value }: { value: RichTextPullQuote }) => (
      <figure className="my-12 border-y border-primary py-8">
        <blockquote className="font-display text-3xl text-balance">
          <p>“{value.text}”</p>
        </blockquote>
        {value.attribution ? (
          <figcaption className="mt-4 text-sm text-muted-foreground">{value.attribution}</figcaption>
        ) : null}
      </figure>
    ),
  },
  unknownType: () => null,
  unknownMark: ({ children }) => <>{children}</>,
  unknownBlockStyle: ({ children }) => <p className="mt-6 text-lg">{children}</p>,
  unknownList: ({ children }) => <ul className="mt-6 list-disc space-y-2 pl-6 text-lg">{children}</ul>,
  unknownListItem: ({ children }) => <li className="pl-2">{children}</li>,
}
