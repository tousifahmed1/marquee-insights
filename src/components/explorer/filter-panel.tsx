import { Button } from '@/components/ui/button'
import { AGE_GROUPS, GENRES, PLATFORMS, REGIONS } from '@/data/dimensions'
import { activeFilterCount } from '@/data/search'
import type { ExplorerSearch } from '@/data/search'
import type { ExplorerOptions } from '@/data/types'
import { formatMonth } from '@/lib/format'

import { AwarenessFilter } from './awareness-filter'
import { FilterSelect } from './filter-select'
import { useExplorerNavigate } from './use-explorer-navigate'

type FilterPanelProps = {
  search: ExplorerSearch
  options: ExplorerOptions
}

export function FilterPanel({ search, options }: FilterPanelProps) {
  const { setFilters, clearFilters } = useExplorerNavigate()
  const months = options.waves.map((wave) => ({ value: wave, label: formatMonth(wave) }))
  const shows = options.shows.map((show) => ({ value: String(show.id), label: show.title }))

  return (
    <div className="space-y-6">
      <FilterSelect
        label="Show"
        allLabel="All shows"
        value={search.show === undefined ? undefined : String(search.show)}
        options={shows}
        onChange={(show) => setFilters({ show })}
      />
      <FilterSelect
        label="Genre"
        allLabel="All genres"
        value={search.genre}
        options={GENRES}
        onChange={(genre) => setFilters({ genre })}
      />
      <FilterSelect
        label="Platform"
        allLabel="All platforms"
        value={search.platform}
        options={PLATFORMS}
        onChange={(platform) => setFilters({ platform })}
      />
      <FilterSelect
        label="Region"
        allLabel="All regions"
        value={search.region}
        options={REGIONS}
        onChange={(region) => setFilters({ region })}
      />
      <FilterSelect
        label="Age group"
        allLabel="All ages"
        value={search.ageGroup}
        options={AGE_GROUPS}
        onChange={(ageGroup) => setFilters({ ageGroup })}
      />
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Survey wave range</legend>
        <FilterSelect
          label="From"
          allLabel="First wave"
          value={search.waveFrom}
          options={months.filter((month) => !search.waveTo || month.value <= search.waveTo)}
          onChange={(waveFrom) => setFilters({ waveFrom })}
        />
        <FilterSelect
          label="To"
          allLabel="Latest wave"
          value={search.waveTo}
          options={months.filter((month) => !search.waveFrom || month.value >= search.waveFrom)}
          onChange={(waveTo) => setFilters({ waveTo })}
        />
      </fieldset>
      <AwarenessFilter
        value={search.minAwareness}
        onCommit={(minAwareness) => setFilters({ minAwareness })}
      />
      <Button
        variant="outline"
        className="w-full"
        disabled={activeFilterCount(search) === 0}
        onClick={clearFilters}
      >
        Clear filters
      </Button>
    </div>
  )
}
