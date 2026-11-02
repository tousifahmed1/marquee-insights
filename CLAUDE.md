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
- `pnpm seed` regenerates and loads the synthetic survey data (not built yet)
- `pnpm deploy` deploys to Cloudflare

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
  content/           ALL CMS access lives here (queries, types, mappers, server functions)
  data/              ALL database access lives here (queries, server functions)
  lib/               framework-free helpers (cache policy, preview session, image URLs, SEO)
  styles/            theme tokens and global CSS
  test/              Vitest helpers, such as renderWithRouter()
studio/              Sanity Studio: schemas in schemaTypes/, desk structure in structure.ts
scripts/             seed scripts and one-off tooling
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
- Secrets (`SANITY_READ_TOKEN`, `SANITY_PREVIEW_SECRET`) are read at runtime from `process.env`. Never give them the `SANITY_STUDIO_` prefix. In production they are Worker secrets (`wrangler secret put`).
- Server functions are protected by TanStack Start's CSRF middleware in `src/start.ts`.

### Caching
- All cache policies live in `src/lib/cache-control.ts`. Routes opt in with `headers: () => cacheHeaders('content')`; never write cache headers by hand.
- Content pages: edge `Cloudflare-CDN-Cache-Control: max-age=3600, stale-while-revalidate=86400`, browser `Cache-Control: public, max-age=0, must-revalidate`. Browsers revalidate so CMS purges reach visitors at once.
- Never use `s-maxage`. Cloudflare disables `stale-while-revalidate` when it is present.
- Preview, draft and data API routes: `Cache-Control: no-store`.
- The Workers cache is checked before the Worker runs and ignores cookies, so per-visitor content can never share a URL with a cached page. That is why draft preview lives under `/preview/*`. The middleware forces `no-store` on every `/preview` and `/api/preview` response, whatever the status.
- Workers caching is on (`wrangler.jsonc`), and Cloudflare caches responses with no `Cache-Control` for up to 2 hours. The global middleware in `src/start.ts` sets `no-store` on any response without a policy, a short edge cache on 404s and `no-store` on 5xx. Do not remove it.
- Not built yet: publishing in the CMS should trigger a webhook that purges the affected URLs. Until then, published changes reach the site within the hour (edge `max-age`) or on the next deploy. Any new content type needs its URLs added to the purge mapping once it exists.
- Cached pages must render the same HTML for every visitor. Never read cookies, headers or sessions into server-rendered markup on a cached route. Per-visitor state (like the theme) is applied on the client; see `src/lib/theme.ts`.

### Styling and motion
- Use theme tokens from `src/styles`. No hard-coded colors, font sizes or spacing values.
- Tailwind's default palette and scales are removed, so `bg-blue-500` or `text-7xl` will not compile. Add new values as tokens in `src/styles/tokens.css` first, then map them in `src/styles/app.css`.
- Use shadcn components before writing new primitives. Add them with `pnpm dlx shadcn@latest add <name>`. Do not run `shadcn init`; the project is already configured.
- Every animation respects `prefers-reduced-motion`.
- Motion supports the content. No animation that delays reading or interaction.

### Testing
- E2e tests open pages with `gotoHydrated()` from `tests/helpers.ts` before clicking or typing, so they never act before React is interactive.
- E2e tests run against the real Sanity dataset. Assert structure and behaviour (one h1, cards link to reports, 404s), not seeded wording, so editing content never breaks the build.
- After a client-side navigation, wait for something that only the new page renders before reading the page. The URL changes before the loader finishes.
- `playwright.config.ts` loads `.env`; the preview test needs `SANITY_PREVIEW_SECRET` and fails without it.

### Code
- TypeScript strict mode. No `any` without a comment explaining why.
- Small files. If a component passes about 150 lines, split it.
- Match existing patterns before inventing new ones. If a new pattern is needed, add it to this file.

## Adding a new CMS block

1. Add the schema in `studio/schemaTypes/blocks/`, export it from `studio/schemaTypes/index.ts` and add its name to `SECTION_TYPES` in `studio/schemaTypes/documents/page.ts`. Give every field a description and validation.
2. Add a `_type == "yourBlock" => { ... }` projection to `PAGE_BY_SLUG_QUERY` in `src/content/queries.ts`, then run `pnpm typegen`.
3. Add the block's type to `SectionBlock` in `src/content/types.ts` and its mapper to `SECTION_MAPPERS` in `src/content/mappers/sections.ts`. Return `null` when required content is missing.
4. Create the component in `src/components/blocks` and register it in `BLOCK_MAP` in `block-map.ts`. TypeScript fails until both the mapper and the component are registered.
5. Add mapper cases for missing and malformed fields to `sections.test.ts`, and a sparse fixture to `section-renderer.test.tsx`.
6. Optionally add it to a seeded page in `scripts/seed-content/site.ts`.
7. Run `pnpm verify`.

## Data

Synthetic survey data only. Fictional show titles, platforms and brands. Never use real show names, studio names or client names anywhere in the code or content.
