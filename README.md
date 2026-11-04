# Marquee Insights

Marketing site and data explorer for a fictional audience research company. A portfolio project showing server rendering, CMS-driven content, edge caching with purge on publish, motion, and a fast filterable view over 50,000 rows of survey data.

**Live:** https://marquee-insights.tousifahmed.workers.dev

All shows, platforms, brands and survey responses are synthetic.

| | |
|---|---|
| Framework | TanStack Start (React 19, TypeScript, file-based routes, server functions) |
| Content | Sanity, with the Studio in `studio/` |
| Data | Neon Postgres through Drizzle and the Neon serverless driver |
| UI | Tailwind CSS, shadcn/ui, TanStack Query and Table, Recharts, Motion, GSAP |
| Hosting | Cloudflare Workers, with rendered pages cached in Workers KV |

## Docs

- [Architecture](docs/architecture.md): request flow, rendering, data
- [Caching and publish](docs/caching.md): KV page cache, webhook setup, affected URLs
- [Running on GCP](docs/gcp.md): Cloud Run, Cloud CDN and Cloud SQL design
- [Working with Claude Code](docs/claude-code.md)
- `CLAUDE.md`: commands, folder layout and the rules every change follows

## Running it locally

```bash
pnpm install
cp .env.example .env     # fill in the values below
pnpm db:migrate          # create the tables in Neon
pnpm seed                # 40 shows and 50,000 responses
pnpm seed:content        # pages, reports and redirects in Sanity (after `pnpm dlx sanity@latest login`)
pnpm dev                 # http://localhost:3000
pnpm studio              # http://localhost:3333
```

| Variable | Public? | Used for |
|---|---|---|
| `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` | Yes, built into the browser bundle | Reading content and building image URLs |
| `SANITY_READ_TOKEN` | No | Reading drafts in preview |
| `SANITY_PREVIEW_SECRET` | No | Turning preview on at `/api/preview/enable` |
| `SANITY_WEBHOOK_SECRET` | No | Verifying the publish webhook |
| `DATABASE_URL` | No | Neon connection string |
| `VITE_SITE_URL` | Yes | Canonical URLs and the sitemap (defaults to the workers.dev URL) |

`pnpm verify` runs typecheck, lint, unit tests and the Playwright suite. `pnpm deploy` builds and deploys. `pnpm check:prod` checks every route on the live site afterwards.

Upload the secrets to the Worker from `.env` in one go:

```bash
node -e "process.loadEnvFile('.env');const k=['DATABASE_URL','SANITY_READ_TOKEN','SANITY_PREVIEW_SECRET','SANITY_WEBHOOK_SECRET'];process.stdout.write(JSON.stringify(Object.fromEntries(k.map(x=>[x,process.env[x]]))))" | pnpm wrangler secret bulk
```
