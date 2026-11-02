import { Menu } from 'lucide-react'
import { motion } from 'motion/react'

import { CmsLink } from '@/components/cms-link'
import { MotionSheet, MotionSheetContent, MotionSheetTrigger } from '@/components/motion/motion-sheet'
import { Button } from '@/components/ui/button'
import { SheetClose, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useSiteSettings } from '@/components/use-site-settings'

export function MobileMenu() {
  const { siteName, navLinks } = useSiteSettings()
  return (
    <MotionSheet>
      <MotionSheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="md:hidden">
          <Menu aria-hidden />
          <span className="sr-only">Open menu</span>
        </Button>
      </MotionSheetTrigger>
      <MotionSheetContent side="right" className="px-gutter">
        <SheetHeader className="px-0 pt-6">
          <SheetTitle className="font-display text-2xl font-normal">
            {siteName}
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Main">
          <ul className="flex flex-col">
            {navLinks.map((link, index) => (
              <motion.li
                key={link.href}
                className="border-b"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + index * 0.04, duration: 0.25, ease: 'easeOut' }}
              >
                <SheetClose asChild>
                  <CmsLink
                    href={link.href}
                    className="block py-4 text-xl text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground"
                  >
                    {link.label}
                  </CmsLink>
                </SheetClose>
              </motion.li>
            ))}
          </ul>
        </nav>
      </MotionSheetContent>
    </MotionSheet>
  )
}
