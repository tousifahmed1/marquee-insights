export type Random = {
  next: () => number
  normal: (mean: number, sd: number) => number
  pick: <T>(items: readonly T[]) => T
  weighted: <T>(items: readonly T[], weights: readonly number[]) => T
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const normal = (mean: number, sd: number) => {
    const u = 1 - next()
    const v = next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const weighted = <T>(items: readonly T[], weights: readonly number[]): T => {
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let roll = next() * total
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i] ?? 0
      if (roll < 0) return items[i] as T
    }
    return items[items.length - 1] as T
  }

  return {
    next,
    normal,
    pick: (items) => items[Math.floor(next() * items.length)] as (typeof items)[number],
    weighted,
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
