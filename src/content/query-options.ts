import { queryOptions } from '@tanstack/react-query'

import { getSiteSettings } from './functions'

export const siteSettingsQueryOptions = queryOptions({
  queryKey: ['content', 'site-settings'],
  queryFn: () => getSiteSettings(),
  staleTime: Infinity,
})
