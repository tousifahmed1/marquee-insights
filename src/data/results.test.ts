import { describe, expect, it } from 'vitest'

import { AGE_GROUPS, PLATFORMS, values } from './dimensions'
import { sortByAverage, toExplorerCharts } from './results'

const [first, second, third] = values(PLATFORMS)

describe('toExplorerCharts', () => {
  it('returns the platform aggregate sorted by average, highest first', () => {
    const charts = toExplorerCharts(
      values(PLATFORMS).map((key, index) => ({ key, average: 40 + ((index * 7) % 11), responses: 10 })),
      [],
    )
    const averages = charts.intentByPlatform.map((group) => group.average ?? -1)
    expect(averages).toEqual([...averages].sort((a, b) => b - a))
    expect(charts.intentByPlatform).toHaveLength(PLATFORMS.length)
  })

  it('puts platforms without responses last', () => {
    const charts = toExplorerCharts([{ key: second!, average: 55, responses: 4 }], [])
    expect(charts.intentByPlatform[0]).toEqual({ key: second, average: 55, responses: 4 })
    expect(charts.intentByPlatform.slice(1).every((group) => group.average === null)).toBe(true)
  })

  it('keeps age groups in age order whatever their averages', () => {
    const ages = values(AGE_GROUPS)
    const charts = toExplorerCharts(
      [],
      ages.map((key, index) => ({ key, average: 90 - index * 30, responses: 5 })).reverse(),
    )
    expect(charts.awarenessByAgeGroup.map((group) => group.key)).toEqual(ages)
  })
})

describe('sortByAverage', () => {
  it('keeps the original order for ties and does not change its input', () => {
    const groups = [
      { key: first!, average: 50, responses: 1 },
      { key: second!, average: 70, responses: 1 },
      { key: third!, average: 50, responses: 1 },
    ]
    expect(sortByAverage(groups).map((group) => group.key)).toEqual([second, first, third])
    expect(groups[0]?.key).toBe(first)
  })
})
