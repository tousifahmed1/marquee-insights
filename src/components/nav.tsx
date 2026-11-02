import { Link } from '@tanstack/react-router'

import { Container } from '@/components/container'
import { MobileMenu } from '@/components/mobile-menu'
import { NAV_LINKS } from '@/components/nav-links'
import { ThemeToggle } from '@/components/theme-toggle'
import { Wordmark } from '@/components/wordmark'

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Wordmark />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm font-medium text-muted-foreground decoration-primary decoration-2 underline-offset-8 hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </Container>
    </header>
  )
}
