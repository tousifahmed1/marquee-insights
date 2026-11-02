import { createColumnHelper, rowSortingFeature, tableFeatures } from '@tanstack/react-table'

import { AGE_GROUPS, GENDERS, GENRES, PLATFORMS, REGIONS, labelFor } from '@/data/dimensions'
import type { ResponseRow } from '@/data/types'
import { formatInteger, formatMonth } from '@/lib/format'

export const tableFeaturesConfig = tableFeatures({ rowSortingFeature })

const column = createColumnHelper<typeof tableFeaturesConfig, ResponseRow>()

export type ColumnMeta = { numeric?: boolean }

export const columns = column.columns([
  column.accessor('wave', {
    id: 'wave',
    header: 'Wave',
    sortDescFirst: true,
    cell: (info) => <span className="whitespace-nowrap">{formatMonth(info.getValue(), 'short')}</span>,
  }),
  column.accessor('showTitle', {
    id: 'show',
    header: 'Show',
    sortDescFirst: false,
    cell: (info) => (
      <span className="block min-w-40">
        <span className="block font-medium">{info.getValue()}</span>
        <span className="block text-xs text-muted-foreground">
          {labelFor(GENRES, info.row.original.genre)}
        </span>
      </span>
    ),
  }),
  column.accessor('platform', {
    header: 'Platform',
    enableSorting: false,
    cell: (info) => <span className="whitespace-nowrap">{labelFor(PLATFORMS, info.getValue())}</span>,
  }),
  column.accessor('region', {
    header: 'Region',
    enableSorting: false,
    cell: (info) => labelFor(REGIONS, info.getValue()),
  }),
  column.accessor('ageGroup', {
    header: 'Age',
    enableSorting: false,
    cell: (info) => <span className="whitespace-nowrap">{labelFor(AGE_GROUPS, info.getValue())}</span>,
  }),
  column.accessor('gender', {
    header: 'Gender',
    enableSorting: false,
    cell: (info) => <span className="whitespace-nowrap">{labelFor(GENDERS, info.getValue())}</span>,
  }),
  column.accessor('awareness', {
    header: 'Awareness',
    sortDescFirst: true,
    meta: { numeric: true },
    cell: (info) => formatInteger(info.getValue()),
  }),
  column.accessor('intent', {
    header: 'Intent',
    sortDescFirst: true,
    meta: { numeric: true },
    cell: (info) => formatInteger(info.getValue()),
  }),
  column.accessor('satisfaction', {
    header: 'Satisfaction',
    sortDescFirst: true,
    meta: { numeric: true },
    cell: (info) => formatInteger(info.getValue()),
  }),
  column.accessor('wouldRecommend', {
    header: 'Recommends',
    enableSorting: false,
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  }),
])
