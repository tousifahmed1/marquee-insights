import { animate, inView } from 'motion'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// The huge top margin counts anything already scrolled past as in view, so a
// fast scroll or a jump link never leaves a section hidden.
export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia(REDUCED_MOTION).matches) return
    if (element.getBoundingClientRect().top < window.innerHeight) return

    const clear = () => {
      element.style.removeProperty('opacity')
      element.style.removeProperty('transform')
    }
    element.style.opacity = '0'
    element.style.transform = 'translateY(1rem)'
    const stop = inView(
      element,
      () => {
        const animation = animate(
          element,
          { opacity: 1, transform: 'translateY(0)' },
          { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        )
        void animation.finished.then(() => requestAnimationFrame(clear))
      },
      { amount: 0.15, margin: '100000px 0px 0px 0px' },
    )
    return () => {
      stop()
      clear()
    }
  }, [])

  return <div ref={ref}>{children}</div>
}
