# Running on GCP

A design for the same app on Google Cloud: Cloud Run serves it, an external Application Load Balancer with Cloud CDN caches it using the same headers, the publish webhook purges the affected URLs, and Cloud SQL replaces Neon. This repo does not deploy or test it.

## Code changes

1. **Build for Node.** In `vite.config.ts`, replace `cloudflare()` with Nitro's `nitro()` plugin. `pnpm build` then writes `.output/server/index.mjs`.
2. **Secrets.** `serverSecret()` in `src/lib/server-env.ts` reads `process.env`, where Cloud Run puts Secret Manager values.
3. **Caching.** `getEdgeStore()` returns the in-memory store with `cachePages: false`, as in development, so every request renders and Cloud CDN caches. `/api/revalidate` purges Cloud CDN instead of bumping a KV version.

## Dockerfile

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

Secrets are never build arguments; they come from Secret Manager at runtime.

## Cloud Run, load balancer and Cloud CDN

```bash
REGION=us-east1
gcloud builds submit --tag "$REGION-docker.pkg.dev/$PROJECT/web/marquee-insights" \
  --build-arg SANITY_STUDIO_PROJECT_ID=... --build-arg VITE_SITE_URL=https://insights.example.com
gcloud run deploy marquee-insights --region "$REGION" \
  --image "$REGION-docker.pkg.dev/$PROJECT/web/marquee-insights" \
  --add-cloudsql-instances "$PROJECT:$REGION:marquee-pg" \
  --set-secrets DATABASE_URL=database-url:latest,SANITY_READ_TOKEN=sanity-read-token:latest,SANITY_PREVIEW_SECRET=sanity-preview-secret:latest,SANITY_WEBHOOK_SECRET=sanity-webhook-secret:latest \
  --ingress internal-and-cloud-load-balancing --allow-unauthenticated

gcloud compute network-endpoint-groups create marquee-neg --region "$REGION" \
  --network-endpoint-type serverless --cloud-run-service marquee-insights
gcloud compute backend-services create marquee-backend --global \
  --load-balancing-scheme EXTERNAL_MANAGED \
  --enable-cdn --cache-mode USE_ORIGIN_HEADERS
gcloud compute backend-services add-backend marquee-backend --global \
  --network-endpoint-group marquee-neg --network-endpoint-group-region "$REGION"
gcloud compute url-maps create marquee-lb --default-service marquee-backend
# Then a managed certificate, a target HTTPS proxy and a global forwarding rule
```

`USE_ORIGIN_HEADERS` makes Cloud CDN follow the app's own `Cache-Control`: content pages cached for an hour and served stale for a day, `no-store` routes never cached, browsers still revalidating HTML.

## Purge on publish

`/api/revalidate` turns `affectedUrls()` into Cloud CDN invalidations through the Compute Engine API (`urlMaps.invalidateCache`), one call per affected path. By hand, for a report publish:

```bash
for path in / /reports /reports/the-second-season-slump /sitemap.xml; do
  gcloud compute url-maps invalidate-cdn-cache marquee-lb --path "$path" --async
done

# Site settings changed
gcloud compute url-maps invalidate-cdn-cache marquee-lb --path "/*" --async
```

`--path` matches without the query string, and a trailing `*` is a prefix match.

## Cloud SQL

- Create a Postgres instance in the Cloud Run region, then a database and a user.
- Store the connection string in Secret Manager as `database-url`, using the Unix socket: `postgresql://USER:PASSWORD@/explorer?host=/cloudsql/PROJECT:us-east1:marquee-pg`.
- In `src/data/db.ts`, swap the Neon HTTP driver for `pg` with `drizzle-orm/node-postgres` and a small pool. `db.batch()` is Neon-specific; use `Promise.all` instead.
- Schema, migrations, query builder and tests stay as they are.
- Run `pnpm db:migrate` and `pnpm seed` through the Cloud SQL Auth Proxy.
