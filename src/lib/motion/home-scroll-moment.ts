import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { parseCountUp } from './count-up'

gsap.registerPlugin(ScrollTrigger)

const CONDITIONS = {
  motion: '(prefers-reduced-motion: no-preference)',
  wide: '(min-width: 48rem)',
}
const PIN_LENGTH = 0.35

function fitsViewport(element: HTMLElement): boolean {
  return element.offsetHeight < window.innerHeight * 0.8
}

function isOnScreen(element: Element): boolean {
  const { top, bottom } = element.getBoundingClientRect()
  return top < window.innerHeight && bottom > 0
}

function headlineDrift(hero: HTMLElement) {
  const headline = hero.querySelector('[data-scroll-moment="headline"]')
  if (!headline) return
  gsap.to(headline, {
    yPercent: -12,
    opacity: 0.35,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  })
}

function statsTimeline(stats: HTMLElement, pinned: boolean) {
  const list = stats.querySelector('dl')
  if (!list || isOnScreen(list)) return undefined

  const timeline = gsap.timeline({ defaults: { ease: 'none' } })
  const rules = stats.querySelectorAll('[data-scroll-moment="rule"]')
  timeline.from(rules, { scaleX: 0, transformOrigin: 'left center', stagger: 0.08, duration: 0.6 }, 0)

  const restores: (() => void)[] = []
  stats.querySelectorAll('[data-scroll-moment="value"]').forEach((element, index) => {
    const text = element.firstChild
    if (!(text instanceof Text)) return
    const original = text.nodeValue ?? ''
    const count = parseCountUp(original)
    if (!count) return
    restores.push(() => {
      text.nodeValue = original
    })
    const state = { value: 0 }
    text.nodeValue = count.format(0)
    timeline.to(
      state,
      {
        value: count.target,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          text.nodeValue = count.format(Math.round(state.value))
        },
      },
      index * 0.08,
    )
  })

  const pinLength = () => window.innerHeight * PIN_LENGTH
  if (pinned) {
    ScrollTrigger.create({
      trigger: stats,
      start: 'center center',
      end: () => `+=${pinLength()}`,
      pin: true,
    })
  }

  ScrollTrigger.create({
    animation: timeline,
    trigger: list,
    start: 'top 85%',
    endTrigger: stats,
    end: () => (pinned ? `center center-=${pinLength()}` : 'center 55%'),
    scrub: 0.4,
  })

  return () => restores.forEach((restore) => restore())
}

export function setupHomeScrollMoment(root: HTMLElement): () => void {
  const hero = root.querySelector<HTMLElement>('[data-scroll-moment="hero"]')
  const stats = root.querySelector<HTMLElement>('[data-scroll-moment="stats"]')
  const media = gsap.matchMedia()

  media.add(CONDITIONS, (context) => {
    const { motion, wide } = context.conditions ?? {}
    if (!motion) return
    if (hero) headlineDrift(hero)
    return stats ? statsTimeline(stats, Boolean(wide) && fitsViewport(stats)) : undefined
  })

  return () => media.revert()
}
