import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

import { NAV_LINKS } from '@/components/nav-links'
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

export function MobileMenu() {
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
            Marquee Insights
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Main">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.to} className="border-b">
                <SheetClose asChild>
                  <Link
                    to={link.to}
                    className="block py-4 text-xl text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
