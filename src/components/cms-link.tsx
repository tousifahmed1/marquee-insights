import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'

type CmsLinkProps = Omit<ComponentProps<'a'>, 'href'> & {
  href: string
}

export function CmsLink({ href, children, ...props }: CmsLinkProps) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    )
  }
  const external = /^https?:/i.test(href)
  return (
    <a href={href} rel={external ? 'noopener noreferrer' : undefined} {...props}>
      {children}
    </a>
  )
}
