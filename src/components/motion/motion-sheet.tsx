import { XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const OpenContext = createContext(false)

const EASE = [0.32, 0.72, 0, 1] as const

const SIDES = {
  right: {
    offset: { x: '100%' },
    className: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sheet',
  },
  bottom: {
    offset: { y: '100%' },
    className: 'inset-x-0 bottom-0 max-h-sheet border-t',
  },
} as const

export function MotionSheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <OpenContext value={open}>{children}</OpenContext>
    </Dialog.Root>
  )
}

export const MotionSheetTrigger = Dialog.Trigger

type MotionSheetContentProps = {
  side: keyof typeof SIDES
  className?: string
  children: ReactNode
}

export function MotionSheetContent({ side, className, children }: MotionSheetContentProps) {
  const open = useContext(OpenContext)
  const { offset, className: sideClassName } = SIDES[side]

  return (
    <AnimatePresence>
      {open ? (
        <Dialog.Portal forceMount>
          <Dialog.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-50 bg-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </Dialog.Overlay>
          <Dialog.Content asChild forceMount>
            <motion.div
              data-slot="sheet-content"
              className={cn(
                'fixed z-50 flex flex-col gap-4 overscroll-contain bg-popover text-sm text-popover-foreground shadow-lg',
                sideClassName,
                className,
              )}
              initial={{ ...offset, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ ...offset, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {children}
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-lg" className="absolute top-2 right-2 size-11">
                  <XIcon aria-hidden />
                  <span className="sr-only">Close</span>
                </Button>
              </Dialog.Close>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      ) : null}
    </AnimatePresence>
  )
}
