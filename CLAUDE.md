# Marquee Insights

Marketing site and data explorer for a fictional entertainment audience research company. Built as a portfolio project to show server rendering, CMS-driven content, motion, edge caching and fast data-heavy interfaces.

## Stack

- TanStack Start (React 19, TypeScript, file-based routing, server functions)
- Tailwind CSS + shadcn/ui (Radix primitives)
- Motion for UI animation, GSAP ScrollTrigger for the home page hero only
- Sanity as the headless CMS
- Neon Postgres for survey data, accessed through its serverless driver
- TanStack Query and TanStack Table on the data explorer
- Deployed to Cloudflare Workers, cached at the edge

## Commands

- `pnpm dev` starts the dev server on port 3000
- `pnpm verify` runs typecheck, lint, unit tests and the Playwright smoke test
- `pnpm seed` regenerates and loads the synthetic survey data
- `pnpm deploy` deploys to Cloudflare

**Always run `pnpm verify` before saying a task is done. If it fails, fix it. Never skip or weaken a check to make it pass.**

## Folder layout

```
src/
  routes/            file-based routes (pages and API routes)
  components/
    ui/              shadcn components, edit only to restyle
    blocks/          one component per CMS section block
    explorer/        data explorer table, filters, charts
  content/           ALL CMS access lives here (queries, types, mappers)
  data/              ALL database access lives here (queries, server functions)
  styles/            theme tokens and global CSS
scripts/             seed script and one-off tooling
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
- Images from the CMS always have alt text and explicit width and height.

### Caching
- Content pages: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- Preview, draft and data API routes: `Cache-Control: no-store`.
- Publishing in the CMS triggers a webhook that purges the affected URLs. Any new content type needs its URLs added to the purge mapping.

### Styling and motion
- Use theme tokens from `src/styles`. No hard-coded colors, font sizes or spacing values.
- Use shadcn components before writing new primitives.
- Every animation respects `prefers-reduced-motion`.
- Motion supports the content. No animation that delays reading or interaction.

### Code
- TypeScript strict mode. No `any` without a comment explaining why.
- Small files. If a component passes about 150 lines, split it.
- Match existing patterns before inventing new ones. If a new pattern is needed, add it to this file.

## Adding a new CMS block

1. Add the schema in the Sanity studio.
2. Add the type and mapper in `src/content`.
3. Create the component in `src/components/blocks`, handling empty fields.
4. Register it in the block map.
5. Add a test fixture with missing fields and check it renders.
6. Run `pnpm verify`.

## Data

Synthetic survey data only. Fictional show titles, platforms and brands. Never use real show names, studio names or client names anywhere in the code or content.
