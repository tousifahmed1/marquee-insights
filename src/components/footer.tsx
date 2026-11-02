import { CmsLink } from '@/components/cms-link'
import { Container } from '@/components/container'
import { useSiteSettings } from '@/components/use-site-settings'
import { Wordmark } from '@/components/wordmark'

export function Footer() {
  const { siteName, footerLinks } = useSiteSettings()
  return (
    <footer className="border-t py-16">
      <Container className="grid gap-10 md:grid-cols-[1fr_auto]">
        <div className="max-w-prose">
          <Wordmark name={siteName} />
          <p className="mt-4 text-sm text-muted-foreground">
            Audience research for film, television, streaming, gaming and sport. All survey
            data, shows, platforms and brands on this site are fictional.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <CmsLink
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </CmsLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-muted-foreground md:col-span-2">
          © {new Date().getFullYear()} {siteName}
        </p>
      </Container>
    </footer>
  )
}
