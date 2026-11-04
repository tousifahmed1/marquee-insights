# Architecture

```text
                         Cloudflare Worker (src/server.ts → src/lib/edge)
  ┌─────────┐     ┌───────────┐  yes
  │ Browser │────►│ Redirect? │──────► 301 / 302 from the Sanity redirect list
  └─────────┘     └─────┬─────┘
                        │ no
                  ┌─────▼──────┐  HIT
                  │ Page in KV?│──────► stored HTML            x-cache: HIT
                  └─────┬──────┘
                        │ MISS
          ┌─────────────▼─────────────┐
          │ TanStack Start            │────► Sanity         pages, reports, settings
          │ server render and         │────► Neon Postgres  survey responses
          │ server functions          │
          └─────────────┬─────────────┘
                        ▼
                  store in KV, send     x-cache: MISS

  Publish in Sanity ── webhook ──► POST /api/revalidate ──► new content version in KV
                                                            (every cached page misses once)
```

## Rendering

- Every page renders on the server, including the explorer. The first response has the real rows and SVG charts. Route loaders call server functions in `src/content` (Sanity) and `src/data` (Postgres), and TanStack Query's cache is sent with the HTML.
- The whole page hydrates. After that, links navigate on the client and fetch through the same server functions.
- Interactive parts: nav, theme toggle, mobile menu, report filters and pagination (plain links), and the explorer (filters in the URL, sorting, paging, charts). Changing a filter keeps the previous results on screen while new ones load.
- Motion: section reveals and sheets use Motion. The home page scroll moment uses GSAP, loaded after hydration on the home page only. Everything respects `prefers-reduced-motion`.

## Data

- **Sanity:** pages built from section blocks, reports with rich text and charts, site settings and redirects. Queries are typed with `sanity typegen`. Mappers in `src/content/mappers` turn results into closed types and drop anything missing or unsafe.
- **Neon Postgres:** `shows` and `responses` (one row per survey answer, 12 monthly waves). Every filter, sort and page is a parameterised query from `src/data/query-builder.ts`, validated with Zod. Each server function makes one round trip with `db.batch()`.

Postgres time per explorer query (`pnpm db:explain`, median of 5 runs):

| Scenario | Rows | Count | Charts |
|---|---|---|---|
| No filters | 0.3 ms | 5.9 ms | 17.8 ms |
| Platform + region | 0.3 ms | 2.2 ms | 5.2 ms |
| Sort by show, page 100 | 9.4 ms | 7.5 ms | 12.9 ms |
| Deepest page (offset 49,900) | 38.6 ms | 12.7 ms | 12.8 ms |

Every combination uses an index. The cost a visitor sees is the round trip to `us-east-1`, kept to one per server function. The Worker runs near each visitor so cached pages stay fast.
