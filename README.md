# Marquee Insights

Marketing site and data explorer for **Marquee Insights**, a fictional audience research company for film, television, streaming, gaming and sport. It is a portfolio project showing server rendering, CMS-driven content, edge caching with purge on publish, motion, and a fast filterable view over 50,000 rows of survey data.

**Live:** https://marquee-insights.tousifahmed.workers.dev

All shows, platforms, brands and survey responses are synthetic.

| | |
|---|---|
| Framework | TanStack Start (React 19, TypeScript, file-based routes, server functions) |
| Content | Sanity, with the Studio in `studio/` |
| Data | Neon Postgres through Drizzle and the Neon serverless driver |
| UI | Tailwind CSS, shadcn/ui, TanStack Query and Table, Recharts, Motion, GSAP |
| Hosting | Cloudflare Workers, with rendered pages cached in Workers KV |

`CLAUDE.md` is the working guide: commands, folder layout and the rules every change follows.

## Running it locally

```bash
pnpm install
cp .env.example .env     # fill in the values, see below
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

`pnpm verify` runs typecheck, lint, the unit tests and the Playwright suite. `pnpm deploy` builds and deploys. `pnpm check:prod` checks every route on the live site afterwards.

The secrets live on the Worker. Upload them from `.env` in one go, so nothing is printed or pasted:

```bash
node -e "process.loadEnvFile('.env');const k=['DATABASE_URL','SANITY_READ_TOKEN','SANITY_PREVIEW_SECRET','SANITY_WEBHOOK_SECRET'];process.stdout.write(JSON.stringify(Object.fromEntries(k.map(x=>[x,process.env[x]]))))" | pnpm wrangler secret bulk
```

## Architecture

```text
                         Cloudflare Worker (src/server.ts)
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

### What renders where

- **Every page renders on the server**, including the explorer: the first response has the real rows and SVG charts, with no spinner. Route loaders call server functions in `src/content` (Sanity) and `src/data` (Postgres), and TanStack Query's cache is sent to the browser with the HTML.
- **The whole page then hydrates** (TanStack Start has no islands). After that, links navigate on the client and fetch data through the same server functions.
- **Interactive pieces:**
  - Nav, theme toggle and mobile menu.
  - Report category filters and pagination, which are plain links.
  - The explorer: filters synced to the URL, sorting, paging and charts. Changing a filter keeps the previous results on screen while new ones load.
- **Motion:**
  - Section reveals and sheet transitions use Motion.
  - The home page's scroll moment uses GSAP, which is loaded after hydration on the home page only.
  - Everything respects `prefers-reduced-motion`.

### Where data comes from

- **Sanity:** pages built from section blocks, reports with rich text and charts, site settings (navigation and SEO defaults), and redirects. Queries are typed with `sanity typegen`. Mappers in `src/content/mappers` turn query results into closed types, and drop anything that is missing or unsafe.
- **Neon Postgres:** `shows` and `responses` (one row per survey answer, 12 monthly waves). Every filter, sort and page is a parameterised SQL query built in `src/data/query-builder.ts` and validated with Zod. Each server function makes one round trip with `db.batch()`.

Postgres time per explorer query, measured with `pnpm db:explain` (median of 5 runs, planning and execution):

| Scenario | Rows | Count | Charts |
|---|---|---|---|
| No filters | 0.3 ms | 5.9 ms | 17.8 ms |
| Platform + region | 0.3 ms | 2.2 ms | 5.2 ms |
| Sort by show, page 100 | 9.4 ms | 7.5 ms | 12.9 ms |
| Deepest page (offset 49,900) | 38.6 ms | 12.7 ms | 12.8 ms |

Every combination uses an index. What a visitor waits for is the round trip to `us-east-1`, which `db.batch()` keeps to one per server function. The Worker runs near each visitor so cached pages stay fast; pinning it next to the database was tried and made cached pages much slower from far away for little gain on the explorer.

### Caching and invalidation

workers.dev has no purge API for Cloudflare's edge cache, so rendered HTML is cached in Workers KV instead, and the Workers cache is turned off.

1. `src/server.ts` first checks the redirect list, which is stored in KV and comes from the Sanity redirect documents. A match answers with 301 or 302.
2. For a content page (home, about, contact, the reports listing and each report), it looks up `page:<release>:v<content version>:<path>` in KV.
   - **HIT:** the stored HTML is returned with `x-cache: HIT` and an `Age` header.
   - **MISS:** the page renders, is stored for a day, and is returned with `x-cache: MISS`.
   - Only 200 HTML responses with the content cache policy are stored, and only canonical query strings are cached.
3. `release` is the deployed Worker version, so a deploy never serves HTML that points at the previous build's assets.
4. Publishing in Sanity calls `POST /api/revalidate`. The route checks the webhook signature and writes the publish time as the new content version, so every cached page renders again on its next request. KV reads are cached for up to 60 seconds, so the change appears everywhere within about a minute.

| Route | `Cache-Control` | KV |
|---|---|---|
| Content pages | `public, s-maxage=3600, stale-while-revalidate=86400` | Cached |
| `/sitemap.xml`, `/robots.txt` | same as content | Rendered each time |
| Redirects | `public, max-age=0, s-maxage=3600` | List cached under the content version |
| 404 | `public, s-maxage=300` | Never |
| `/explore`, `/preview/*`, `/api/*`, server functions, 5xx | `no-store` | Never |

The headers are written for a real CDN. `s-maxage` only applies to shared caches, so browsers always revalidate HTML and a purge reaches visitors at once.

Measured on the live site: a MISS took 0.46–1.2 s, the following HIT about 55 ms, and a published edit was live within 50 seconds without a redeploy.

### Publish webhook

Set this up once in the Sanity dashboard:

1. Add `SANITY_WEBHOOK_SECRET` to `.env` (`openssl rand -hex 32`) and upload it to the Worker with the `wrangler secret bulk` command above.
2. Open [sanity.io/manage](https://www.sanity.io/manage), pick **this site's project**, then **API → Webhooks → Create webhook**.
3. Fill in:
   - **Name**: `Purge site cache`
   - **URL**: `https://marquee-insights.tousifahmed.workers.dev/api/revalidate`
   - **Dataset**: `production`
   - **Trigger on**: Create, Update, Delete
   - **Filter**: `_type in ["page", "report", "siteSettings", "redirect"]`
   - **Projection**:
     ```groq
     {
       "_id": coalesce(after()._id, before()._id),
       "_type": coalesce(after()._type, before()._type),
       "operation": delta::operation(),
       "slug": after().slug.current,
       "previousSlug": before().slug.current,
       "from": after().from,
       "previousFrom": before().from
     }
     ```
   - **Status**: Enable webhook
   - **HTTP method**: `POST`
   - **API version**: `v2025-02-19`
   - **Drafts** and **Versions**: leave off, so only published changes trigger it
   - **Secret**: the value of `SANITY_WEBHOOK_SECRET`
4. Save, then check it is registered with `cd studio && pnpm exec sanity hook list`. Publish any change and look for a `200` in the webhook's **Attempts log**.

The endpoint rejects calls without a valid `sanity-webhook-signature` header. Test it with `pnpm webhook:test <site-url>`, which signs a sample payload with the secret from `.env`.

### Which URLs a change affects

Each webhook call logs the document that changed and the URLs it affects (`pnpm wrangler tail`):

```json
{"event":"content-published","id":"page-about","type":"page","operation":"update","urls":["/about","/sitemap.xml"]}
```

The mapping is `affectedUrls()` in `src/lib/purge-map.ts`:

| Document | Affected URLs |
|---|---|
| Report | `/reports/<slug>` (and the old slug if it changed), `/reports`, `/`, `/sitemap.xml` |
| Page | `/<slug>` (`/` for the home page), `/sitemap.xml` |
| Redirect | its source path (old and new) |
| Site settings | `/*`: navigation and SEO defaults appear on every page |

KV doesn't need the list: one version bump invalidates everything, which is simple and correct for a site this size. On a CDN with per-URL purging, these are the paths to purge instead, as shown in the next section. A path covers every query string, so purging `/reports` also clears `/reports?category=film&page=2`.

## Running this on GCP

To run the same app on Google Cloud: Cloud Run serves it, an external Application Load Balancer with Cloud CDN caches it using the same headers, the publish webhook purges exactly the affected URLs, and Cloud SQL replaces Neon. This is a design, not something this repo deploys or tests.

### Code changes for Node

The app code stays. Three Cloudflare-specific pieces change:

1. **Build for Node.** In `vite.config.ts`, replace `cloudflare()` with Nitro's `nitro()` plugin from `nitro/vite`. `pnpm build` then writes `.output/server/index.mjs`, and `wrangler.jsonc` is no longer used.
2. **Secrets.** `serverSecret()` in `src/lib/server-env.ts` reads `process.env`, where Cloud Run puts Secret Manager values.
3. **Caching.**
   - `getPageCache()` returns `null`, so `src/server.ts` renders every request and Cloud CDN does the caching.
   - Redirects use the in-memory list that development already uses.
   - `/api/revalidate` purges Cloud CDN instead of bumping a KV version (below).

### Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY studio/package.json studio/
RUN pnpm install --frozen-lockfile
COPY . .
# Public values only: Vite builds these into the browser bundle.
ARG SANITY_STUDIO_PROJECT_ID
ARG SANITY_STUDIO_DATASET=production
ARG VITE_SITE_URL
RUN pnpm build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/.output ./.output
USER node
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
```

Secrets are never build arguments. They come from Secret Manager at runtime.

### Cloud Run, the load balancer and Cloud CDN

```bash
REGION=us-east1
gcloud builds submit --tag "$REGION-docker.pkg.dev/$PROJECT/web/marquee-insights" \
  --build-arg SANITY_STUDIO_PROJECT_ID=... --build-arg VITE_SITE_URL=https://insights.example.com
gcloud run deploy marquee-insights --region "$REGION" \
  --image "$REGION-docker.pkg.dev/$PROJECT/web/marquee-insights" \
  --add-cloudsql-instances "$PROJECT:$REGION:marquee-pg" \
  --set-secrets DATABASE_URL=database-url:latest,SANITY_READ_TOKEN=sanity-read-token:latest,SANITY_PREVIEW_SECRET=sanity-preview-secret:latest,SANITY_WEBHOOK_SECRET=sanity-webhook-secret:latest \
  --ingress internal-and-cloud-load-balancing --allow-unauthenticated

# A serverless NEG puts Cloud Run behind the global load balancer
gcloud compute network-endpoint-groups create marquee-neg --region "$REGION" \
  --network-endpoint-type serverless --cloud-run-service marquee-insights
gcloud compute backend-services create marquee-backend --global \
  --load-balancing-scheme EXTERNAL_MANAGED \
  --enable-cdn --cache-mode USE_ORIGIN_HEADERS
gcloud compute backend-services add-backend marquee-backend --global \
  --network-endpoint-group marquee-neg --network-endpoint-group-region "$REGION"
gcloud compute url-maps create marquee-lb --default-service marquee-backend
# Then a managed certificate, a target HTTPS proxy and a global forwarding rule as usual
```

`USE_ORIGIN_HEADERS` makes Cloud CDN follow the app's own `Cache-Control`, so nothing changes in the code:
- Content pages are cached for an hour (`s-maxage=3600`) and served stale while revalidating for a day. Cloud CDN supports the `stale-while-revalidate` directive.
- `no-store` responses (`/explore`, previews, the API, server functions) are never cached.
- Browsers still revalidate HTML, because `s-maxage` only applies to shared caches.

### Per-URL purge on publish

On GCP, `/api/revalidate` turns `affectedUrls()` into Cloud CDN invalidations. By hand, the same thing for a report publish is:

```bash
for path in / /reports /reports/the-second-season-slump /sitemap.xml; do
  gcloud compute url-maps invalidate-cdn-cache marquee-lb --path "$path" --async
done

# Site settings changed: everything
gcloud compute url-maps invalidate-cdn-cache marquee-lb --path "/*" --async
```

Some details:
- `--path` matches the path without the query string, so `/reports` clears every filtered and paginated listing.
- A trailing `*` is a prefix match, which is how `/*` from the site settings mapping works.
- In the app, the route makes the same calls through the Compute Engine API (`urlMaps.invalidateCache`), using the Cloud Run service account with permission to invalidate that URL map.
- Invalidation is asynchronous and rate-limited, so the route sends one call per affected path (a handful per publish) rather than purging everything each time.

### Cloud SQL instead of Neon

- Create a Postgres instance in the same region as Cloud Run (`gcloud sql instances create marquee-pg --database-version POSTGRES_17 --region us-east1`), then a database and a user.
- Store the connection string in Secret Manager as `database-url`, using the Cloud SQL Unix socket: `postgresql://USER:PASSWORD@/explorer?host=/cloudsql/PROJECT:us-east1:marquee-pg`.
- In `src/data/db.ts`, swap the Neon HTTP driver for `pg` and `drizzle-orm/node-postgres` with a small connection pool.
  - `db.batch()` is Neon-specific. Run each function's queries with `Promise.all` on the pool instead.
  - Within one region, the parallel queries cost about one round trip.
- `src/data/schema.ts`, the migrations, the query builder and the tests stay as they are, because they're plain Postgres through Drizzle.
- Run `pnpm db:migrate` and `pnpm seed` through the Cloud SQL Auth Proxy, with `DATABASE_URL` pointing at `localhost`.

## Working with Claude Code

This project was built with Claude Code as the main pair. Three things kept it productive across a long build.

**`CLAUDE.md` holds the rules, not just the commands.** It records:
- the folder boundaries: all CMS access in `src/content`, all database access in `src/data`
- the rendering rule: the first view of every page renders on the server
- the caching rules and why they exist
- the security rules: never `dangerouslySetInnerHTML` on CMS content, secrets only through `serverSecret()`
- the gotchas found along the way, for example that Recharts 3 renders nothing on the server, so the charts use 2.15

When something goes wrong, the fix is written into `CLAUDE.md` along with the reason, so the next session starts from what was learned instead of repeating it.

**`pnpm verify` is the definition of done.** It runs:
- typecheck, including regenerating the Sanity query types
- lint
- about 300 unit tests
- the Playwright suite against its own dev server on its own port

The rule is that a task isn't finished until it passes, and that a check is never weakened to make it pass. It stops the agent from reporting success on code that only looks right. For example, one change replaced an old cache-header test because the brief deliberately changed the policy, and the summary says so instead of quietly deleting the test.

**Small conventions add up:**
- Each feature is a numbered step that stops for review, and each step is its own commit.
- Production deploys and secrets stay with a person.
- Secrets are never printed: they're checked as "set" or moved from `.env` straight to Wrangler.
- After every deploy, `pnpm check:prod` checks the live site, because local and production can disagree.

### Where it went wrong: the secret that was set but empty

After the first full deploy, `/explore` returned 500 with `DATABASE_URL is not set`, and draft preview said it wasn't configured. `wrangler secret list` showed all three secrets attached to the Worker.

The agent decided `process.env` must be empty on deployed Workers. It rewrote every secret read to use `cloudflare:workers` `env`, confirmed it worked in a local production build, added a rule to `CLAUDE.md` ("never read secrets from `process.env`, it is empty on deployed Workers") and asked for a deploy.

The deploy didn't help: the binding was missing too. The local test hadn't shown anything, because the old code had worked locally all along.

The real cause was that the secrets existed by name but held empty strings, most likely from the interactive `wrangler secret put` prompt receiving nothing. Re-uploading them from `.env` with `wrangler secret bulk` fixed production at once.

What changed:
- **The workflow.** `pnpm check:prod` now runs against the live site after every deploy. Secrets are uploaded from `.env` with `wrangler secret bulk`, never pasted.
- **`CLAUDE.md`.** It now says: if a secret reads as missing in production, check its value is not empty before changing code. The wrong rule about `process.env` was found while writing this section and corrected. `serverSecret()` stayed, because one place for secret reads is still worth having, but its comment no longer claims a cause that was never true.
- **The lesson for the agent.** When something works locally and fails in production, compare the two environments before rewriting code. And a fix that "works locally" proves nothing if the old code also worked locally.
