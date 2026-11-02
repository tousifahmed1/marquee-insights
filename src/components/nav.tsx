import { CmsLink } from '@/components/cms-link'
import { Container } from '@/components/container'
import { MobileMenu } from '@/components/mobile-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSiteSettings } from '@/components/use-site-settings'
import { Wordmark } from '@/components/wordmark'

export function Nav() {
  const { siteName, navLinks } = useSiteSettings()
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Wordmark name={siteName} />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <CmsLink
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground decoration-highlight decoration-2 underline-offset-8 hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline"
                >
                  {link.label}
                </CmsLink>
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
