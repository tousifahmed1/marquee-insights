import { Link } from '@tanstack/react-router'

import { Container } from '@/components/container'
import { NAV_LINKS } from '@/components/nav-links'
import { Wordmark } from '@/components/wordmark'

export function Footer() {
  return (
    <footer className="border-t py-16">
      <Container className="grid gap-10 md:grid-cols-[1fr_auto]">
        <div className="max-w-prose">
          <Wordmark />
          <p className="mt-4 text-sm text-muted-foreground">
            Audience research for film, television and streaming. All survey
            data, shows, platforms and brands on this site are fictional.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-muted-foreground md:col-span-2">
          © {new Date().getFullYear()} Marquee Insights
        </p>
      </Container>
    </footer>
  )
}
