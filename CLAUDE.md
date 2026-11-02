# Marquee Insights

Marketing site and data explorer for a fictional entertainment audience research company. Built as a portfolio project to show server rendering, CMS-driven content, motion, edge caching and fast data-heavy interfaces.

## Stack

- TanStack Start (React 19, TypeScript, file-based routing, server functions)
- Tailwind CSS + shadcn/ui (Radix primitives)
- Motion for UI animation, GSAP ScrollTrigger for the home page hero only
- Sanity as the headless CMS, with the Studio in `studio/` (a pnpm workspace package)
- Neon Postgres for survey data, accessed through its serverless driver
- TanStack Query and TanStack Table on the data explorer
- Deployed to Cloudflare Workers, cached at the edge

## Commands

- `pnpm dev` starts the dev server on port 3000
- `pnpm verify` runs typecheck, lint, unit tests and the Playwright smoke test
- `pnpm e2e` starts its own dev server on port 3917 (override with `E2E_PORT`), separate from `pnpm dev`. It never reuses a running server, so if the port is busy it fails instead of testing another app
- `pnpm studio` runs the Sanity Studio on port 3333
- `pnpm typegen` regenerates GROQ result types into `src/content/sanity.types.ts` (also run by `pnpm typecheck`)
- `pnpm seed:content` writes the seed pages and reports to Sanity using your Sanity CLI login. Safe to re-run
- `pnpm seed` clears and reloads the synthetic survey data in Neon (40 shows, 50,000 responses). Safe to re-run
- `pnpm db:generate` creates a migration from `src/data/schema.ts`; `pnpm db:migrate` applies it
- `pnpm db:explain` runs the explorer queries for typical filter combinations with `EXPLAIN ANALYZE` and fails if any takes 200ms or more in Postgres
- `pnpm deploy` builds and deploys to Cloudflare. It always rebuilds, so never run `wrangler deploy` on its own: a stale `dist/` ships old code
- `pnpm check:prod` checks every route on the live site after a deploy (pass a URL to check another server)
- `pnpm webhook:test <url>` sends a signed publish webhook to `<url>/api/revalidate`, using `SANITY_WEBHOOK_SECRET` from `.env`

**Always run `pnpm verify` before saying a task is done. If it fails, fix it. Never skip or weaken a check to make it pass.**

## Folder layout

```
src/
  routes/            file-based routes (pages, /preview/* drafts and /api/* server routes)
  components/
    ui/              shadcn components, edit only to restyle
    blocks/          one component per CMS section block, plus the block map and SectionRenderer
    rich-text/       the shared Portable Text renderer
    reports/         report listing and article components
    explorer/        data explorer table, filters, charts
    motion/          Reveal and MotionSheet
  content/           ALL CMS access lives here (queries, types, mappers, server functions)
  data/              ALL database access lives here (queries, server functions)
  lib/               framework-free helpers (cache policy, preview session, image URLs, SEO, motion/)
  styles/            theme tokens and global CSS
  test/              Vitest helpers, such as renderWithRouter()
studio/              Sanity Studio: schemas in schemaTypes/, desk structure in structure.ts
scripts/             seed scripts and one-off tooling
public/              favicon, touch icon and logo, drawn by scripts/brand-icons.ts
tests/               Playwright smoke tests
```

## Rules

### Rendering and data
- Pages render on the server by default. Add client interactivity only where it is needed.
- The first view of every page, including the data explorer, must render on the server. No loading spinners on first paint.
- Never call the CMS or the database from a component. Go through `src/content` or `src/data`.
- Database filtering, sorting and pagination happen in Postgres, never in the browser.
- Explorer filters live in the URL search params so every view is shareable.

### Content
- Every CMS block has one component in `src/components/blocks` and is registered in the block map.
- Every block must render safely with missing or empty fields. Unknown block types render nothing, never crash.
- Rich text is rendered through the shared renderer, which sanitizes output. Never use `dangerouslySetInnerHTML` on CMS content.
- Images from the CMS always have alt text and explicit width and height. Render them with `CmsImage`; mappers drop any image without alt text.
- Queries use `defineQuery` in `src/content/queries.ts`. Mappers take the generated result types, never trust their shape at runtime, and return the closed types in `src/content/types.ts`: `null` or `[]` for missing content, never `undefined`. A block missing its required content is dropped by its mapper.
- Components get content from route loaders that call the server functions in `src/content/functions.ts`. Site settings come from the root route context via `useSiteSettings()`.
- Links from the CMS go through `CmsLink`, and every href passes `safeHref()` (site paths, `https://` and `mailto:` only).

### Environment
- `SANITY_STUDIO_*` values are public: Vite builds them into the browser bundle (the image URL builder needs them) and the Studio does the same. `.env` must exist when you build or deploy.
- Secrets (`DATABASE_URL`, `SANITY_READ_TOKEN`, `SANITY_PREVIEW_SECRET`, `SANITY_WEBHOOK_SECRET`) are read at runtime with `serverSecret()` from `src/lib/server-env.ts`, which reads the Worker bindings. Never read them from `process.env`: it works in development but is empty on deployed Workers. Never give them the `SANITY_STUDIO_` prefix. In production they are Worker secrets (`wrangler secret put`); locally they come from `.env`.
- `src/lib/server-env.ts` imports `cloudflare:workers`, so only server-only modules (server function handlers, server routes, `src/data`, `src/content` clients) may import it, never a component.
- Server functions are protected by TanStack Start's CSRF middleware in `src/start.ts`.

### Database
- `src/data/schema.ts` is the source of truth. Change it, run `pnpm db:generate`, review the SQL, then `pnpm db:migrate`. Never edit a migration that has been applied; add a new one.
- Dimension values and labels (platforms, genres, regions, age groups, genders) live in `src/data/dimensions.ts`. The enums, Zod schemas and filter UI all read from there.
- Explorer inputs are validated by the Zod schemas in `src/data/filters.ts`. Every filter becomes a `WHERE` condition in `src/data/query-builder.ts`, and every sort ends with `id` so pages never overlap.
- Each server function makes one round trip: send its queries together with `db.batch()`. In development, `timed()` logs each call as `[data] <label> <ms>`.
- The Neon database is in `us-east-1`, so expect about 300ms per round trip from far away in development. In production, Smart Placement (`placement.mode` in `wrangler.jsonc`) runs the Worker near the database when that is faster; the `cf-placement` response header shows where a request ran. Measure query cost with `pnpm db:explain`, not with the dev log.
- Run `pnpm db:explain` after changing a query or an index. Add an index rather than accept a query over 200ms.
- Server-only packages used in development (like drizzle and zod) are listed in `environments.ssr.optimizeDeps.include` in `vite.config.ts`. Add new ones there, or Vite reloads mid-request on a cold start and breaks e2e runs.

### Data explorer
- `/explore` keeps every filter, sort and page in the URL. `cleanSearch()` in `src/data/search.ts` validates them: invalid values are dropped, defaults are left out of the URL and an inverted wave range is swapped. Changing a filter resets the page.
- The loader awaits the data on first load, so the server renders real rows and charts. On a search change (`cause === 'stay'`) it only prefetches; components read through `useQuery` with `keepPreviousData`, so the previous results stay on screen with an "Updating" indicator. Don't await in the loader for `stay`, or the controls lag behind the URL.
- Charts use Recharts 2.15 because Recharts 3 renders nothing on the server. Axes, bars and tooltips must be direct children of the chart (no fragments or wrapper components), every chart gets `id={useId()}` so clip-path ids match after hydration, and every chart has a visually hidden data table.
- Radix `Select` only fills in its value after hydration. Pass the selected label as `SelectValue` children so the server renders it.

### SEO
- Every page route sets its head with `seoHead(resolveSeo(settings, { ... }))` from `src/lib/seo.ts`. Pass the page's `path` so it gets a canonical URL and `og:url`; leave it out for previews and pages without a public URL. Document SEO fields win over page fields, which win over the `siteSettings` defaults.
- Titles always read "Page title | Marquee Insights". `formatTitle()` adds the site name and removes it if an editor already typed it, so never add it by hand.
- Absolute URLs come from `absoluteUrl()` in `src/lib/site.ts` (`VITE_SITE_URL`, defaulting to the workers.dev URL), never from the request, because cached HTML is shared by every visitor.
- JSON-LD goes in `meta` as `{ 'script:ld+json': data }` (see `src/lib/structured-data.ts`). TanStack escapes it, so CMS text is safe there. Never render JSON-LD with `dangerouslySetInnerHTML`. The root route adds Organization data and report pages add Article data.
- `/sitemap.xml` lists the static routes in `STATIC_SITEMAP_PATHS` (`src/lib/sitemap.ts`) plus every page and report without "Hide from search engines". A new code-only page needs adding there. `/robots.txt` points to it.
- Redirect documents in Sanity are served by `src/server.ts` before any page renders: 301 when permanent, 302 when not. The list is stored in KV under the content version, so publishing a redirect takes effect like any other publish. `mapRedirects()` drops anything that is not a site path to a site path or an `https://` URL.

### Caching
- All cache policies live in `src/lib/cache-control.ts`. Routes opt in with `headers: () => cacheHeaders('content')`; never write cache headers by hand.
- Content pages send `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, which is right for a real CDN later. `s-maxage` only applies to shared caches, so browsers always revalidate HTML. Never give HTML a browser `max-age`, or a publish will not reach visitors at once.
- Rendered content pages are cached in Workers KV (`PAGE_CACHE`). `src/server.ts` wraps every request in `servePage()` from `src/lib/page-cache.ts`: it looks up `page:<release>:v<version>:<path>` and sends `x-cache: HIT` or `MISS`. The release is the deployed Worker version (`CF_VERSION_METADATA`), so a deploy never serves HTML pointing at old assets; the version is the `content-version` key in KV, bumped to invalidate every page at once. A page is stored (for a day) only when it is a 200 HTML response with the content policy, so a route opts in by using `cacheHeaders('content')`.
- `cacheablePath()` decides which URLs are looked up. `/explore`, `/api`, `/_serverFn`, `/preview` and files are never cached, and query strings are only cached when they are canonical (only `category` and `page` on `/reports`). A new route with search params needs its params added to `CACHEABLE_SEARCH`, or it is rendered on every request.
- The page cache is off in development (`getPageCache()` returns null) so changes show at once. Test it with a production build: `pnpm build && pnpm wrangler dev -c dist/server/wrangler.json`.
- The Workers cache is off in `wrangler.jsonc`. It runs before the Worker and cannot be purged on workers.dev, so with `s-maxage` it would keep serving pages for an hour after a publish.
- Preview, draft, data API routes and `/explore`: `Cache-Control: no-store`.
- Per-visitor content can never share a URL with a cached page: the cache key ignores cookies. That is why draft preview lives under `/preview/*`. The middleware forces `no-store` on every `/preview` and `/api/preview` response, whatever the status.
- The global middleware in `src/start.ts` sets `no-store` on any response without a policy, a short shared cache on 404s and `no-store` on 5xx. Do not remove it.
- Publishing in Sanity calls `POST /api/revalidate` (a Sanity webhook, set up as described in `README.md`). It checks the `sanity-webhook-signature` header against `SANITY_WEBHOOK_SECRET`, then writes the publish time as the new content version, so every cached page renders again on its next request (within about 60 seconds everywhere, as KV reads are cached that long). It also logs the document and the URLs it affects from `affectedUrls()` in `src/lib/purge-map.ts`, which is what a CDN with per-URL purging would invalidate.
- A new content type, or a new URL a document appears on, needs a case in `affectedUrls()` and in `purge-map.test.ts`, and its fields in the webhook projection in `README.md` if the mapping reads them.
- The published Sanity client reads the live API (`useCdn: false`), not Sanity's CDN, so the first render after a purge never picks up content from before the publish.
- `pnpm webhook:test <url> [type] [slug]` sends a signed test webhook, for example to a production build running in `wrangler dev`.
- Cached pages must render the same HTML for every visitor. Never read cookies, headers or sessions into server-rendered markup on a cached route. Per-visitor state (like the theme) is applied on the client; see `src/lib/theme.ts`.

### Styling and motion
- Use theme tokens from `src/styles`. No hard-coded colors, font sizes or spacing values.
- `primary` (bright amber) is for fills: buttons, bars, bulbs, borders. Amber text, icons and underlines on the page background use `highlight` (`text-highlight`, `decoration-highlight`), which is darker in the light theme: bright amber on paper is 1.5:1. Check both themes for contrast.
- Fonts are self-hosted with Fontsource (latin subset) and imported at the top of `app.css`. The two files the first screen needs are preloaded in `__root.tsx`. Never load fonts from Google or another origin: it costs about a second of render-blocking time on mobile.
- Tailwind's default palette and scales are removed, so `bg-blue-500` or `text-7xl` will not compile. Add new values as tokens in `src/styles/tokens.css` first, then map them in `src/styles/app.css`.
- `ui/slider.tsx` forwards `aria-label`, `aria-labelledby` and `aria-valuetext` to the thumb, the element with `role="slider"`; keep that if you regenerate it.
- Use shadcn components before writing new primitives. Add them with `pnpm dlx shadcn@latest add <name>`. Do not run `shadcn init`; the project is already configured.
- Every animation respects `prefers-reduced-motion`. Motion components get this from `<MotionConfig reducedMotion="user">` in `__root.tsx` (transforms off, fades kept). Anything driven outside React (`Reveal`, GSAP) checks the media query itself.
- Motion supports the content. No animation that delays reading or interaction.
- Animate only `transform` and `opacity`, never layout properties, and never hide server-rendered content that is already on screen. Load-time states are applied after hydration and only to things below the fold, so first paint is always the real page.
- GSAP is for the home page scroll moment only (`src/lib/motion/home-scroll-moment.ts`). The home route imports it dynamically after mount, and not at all for reduced motion, so no other page downloads it. It finds its targets through `data-scroll-moment` attributes on the hero and stats blocks.
- A GSAP-pinned element must not sit inside a transformed parent. That is why `SectionRenderer` wraps only feature grids, quotes and CTA banners in `Reveal`.
- Use Motion (`motion/react`) for everything else. Sheets use `MotionSheet` in `src/components/motion`, which drives the Radix dialog through `AnimatePresence` so it animates out as well as in.

### Error and 404 pages
- `NotFound` and `ErrorPage` (built on `StatusPage`) are the router's defaults and the root's components, so every route gets them. The root `head` gives them a "Page not found" or "Something went wrong" title with `noindex`, which is why route heads return `{}` when they have no loader data. `ErrorPage` shows error details only in development.

### Testing
- E2e tests open pages with `gotoHydrated()` from `tests/helpers.ts` before clicking or typing, so they never act before React is interactive.
- E2e tests run against the real Sanity dataset. Assert structure and behaviour (one h1, cards link to reports, 404s), not seeded wording, so editing content never breaks the build.
- After a client-side navigation, wait for something that only the new page renders before reading the page. The URL changes before the loader finishes.
- `playwright.config.ts` loads `.env`; the preview test needs `SANITY_PREVIEW_SECRET`, the webhook test needs `SANITY_WEBHOOK_SECRET` and the explorer tests need `DATABASE_URL` with seeded data (`pnpm seed`). Both fail without them.
- Explorer logic is tested without a database: Zod schemas in `filters.test.ts`, URL cleaning in `search.test.ts`, and the query builder compiled to SQL text and parameters in `query-builder.test.ts`. A new filter needs a case in all three.

### Code
- TypeScript strict mode. No `any` without a comment explaining why.
- Small files. If a component passes about 150 lines, split it.
- Match existing patterns before inventing new ones. If a new pattern is needed, add it to this file.

## Adding a new CMS block

1. Add the schema in `studio/schemaTypes/blocks/`, export it from `studio/schemaTypes/index.ts` and add its name to `SECTION_TYPES` in `studio/schemaTypes/documents/page.ts`. Give every field a description and validation.
2. Add a `_type == "yourBlock" => { ... }` projection to `PAGE_BY_SLUG_QUERY` in `src/content/queries.ts`, then run `pnpm typegen`.
3. Add the block's type to `SectionBlock` in `src/content/types.ts` and its mapper to `SECTION_MAPPERS` in `src/content/mappers/sections.ts`. Return `null` when required content is missing.
4. Create the component in `src/components/blocks` and register it in `BLOCK_MAP` in `block-map.ts`. TypeScript fails until both the mapper and the component are registered. If it should fade in on scroll, add it to `REVEALED_BLOCKS` in `section-renderer.tsx` (not if it is pinned or sits at the top of a page).
5. Add mapper cases for missing and malformed fields to `sections.test.ts`, and a sparse fixture to `section-renderer.test.tsx`.
6. Optionally add it to a seeded page in `scripts/seed-content/site.ts`.
7. Run `pnpm verify`.

## Data

Synthetic survey data only. Fictional show titles, platforms and brands. Never use real show names, studio names or client names anywhere in the code or content.
