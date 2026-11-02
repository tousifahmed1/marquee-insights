import { Menu } from 'lucide-react'

import { CmsLink } from '@/components/cms-link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSiteSettings } from '@/components/use-site-settings'

export function MobileMenu() {
  const { siteName, navLinks } = useSiteSettings()
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="md:hidden">
          <Menu aria-hidden />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="px-gutter">
        <SheetHeader className="px-0 pt-6">
          <SheetTitle className="font-display text-2xl font-normal">
            {siteName}
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Main">
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.href} className="border-b">
                <SheetClose asChild>
                  <CmsLink
                    href={link.href}
                    className="block py-4 text-xl text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground"
                  >
                    {link.label}
                  </CmsLink>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
