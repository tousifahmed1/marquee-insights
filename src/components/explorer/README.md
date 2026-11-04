# explorer

The `/explore` page: filter panel (sidebar on desktop, a sheet on mobile), Recharts bar charts and the TanStack Table results with server-side sorting and pagination. URL changes go through `useExplorerNavigate()`, which calls the pure `with*` functions in `src/data/search.ts`; data comes from `useExplorerData()`, built on `explorerQueries()` in `src/data/explorer-queries.ts`.
