# Caching and publish

workers.dev has no purge API for Cloudflare's edge cache, so rendered HTML is cached in Workers KV and the Workers cache is off.

## Request flow

`handleEdgeRequest()` in `src/lib/edge` runs before the app:

1. A matching Sanity redirect answers with 301 or 302. The list is stored in KV under the content version.
2. A content page (home, about, contact, reports listing, each report) is looked up as `page:<release>:v<content version>:<path>`.
   - **HIT:** stored HTML with `x-cache: HIT` and an `Age` header.
   - **MISS:** the page renders, is stored for a day, and is sent with `x-cache: MISS`.
   - Only 200 HTML responses with the content policy are stored, and only canonical query strings.
3. `release` is the deployed Worker version, so a deploy never serves HTML pointing at old assets.
4. A publish writes the publish time as the new content version, so every cached page renders again on its next request. KV reads are cached for up to 60 seconds, so the change appears everywhere within about a minute.

| Route | `Cache-Control` | KV |
|---|---|---|
| Content pages | `public, s-maxage=3600, stale-while-revalidate=86400` | Cached |
| `/sitemap.xml`, `/robots.txt` | same as content | Rendered each time |
| Redirects | `public, max-age=0, s-maxage=3600` | List cached under the content version |
| 404 | `public, s-maxage=300` | Never |
| `/explore`, `/preview/*`, `/api/*`, server functions, 5xx | `no-store` | Never |

`s-maxage` only applies to shared caches, so browsers always revalidate HTML and a publish reaches visitors at once.

Measured on the live site: a MISS 0.46–1.2 s, the next HIT about 55 ms, a published edit live within 50 seconds.

## Webhook setup

1. Add `SANITY_WEBHOOK_SECRET` to `.env` (`openssl rand -hex 32`) and upload it with the `wrangler secret bulk` command in the README.
2. In [sanity.io/manage](https://www.sanity.io/manage), open the project, then **API → Webhooks → Create webhook**:
   - **Name:** `Purge site cache`
   - **URL:** `https://marquee-insights.tousifahmed.workers.dev/api/revalidate`
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **Filter:** `_type in ["page", "report", "siteSettings", "redirect"]`
   - **Projection:**
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
   - **HTTP method:** `POST`
   - **API version:** `v2025-02-19`
   - **Drafts** and **Versions:** off
   - **Secret:** the value of `SANITY_WEBHOOK_SECRET`
3. Check it with `cd studio && pnpm exec sanity hook list`, then publish a change and look for a `200` in the Attempts log.

Calls without a valid `sanity-webhook-signature` header are rejected. `pnpm webhook:test <site-url>` sends a signed sample payload.

## Affected URLs

Each webhook call logs the document and the URLs it affects (`pnpm wrangler tail`):

```json
{"event":"content-published","id":"page-about","type":"page","operation":"update","urls":["/about","/sitemap.xml"]}
```

The mapping is `affectedUrls()` in `src/lib/purge-map.ts`:

| Document | Affected URLs |
|---|---|
| Report | `/reports/<slug>` (and the old slug if it changed), `/reports`, `/`, `/sitemap.xml` |
| Page | `/<slug>` (`/` for the home page), `/sitemap.xml` |
| Redirect | its source path (old and new) |
| Site settings | `/*` |

KV ignores this list: one version bump invalidates everything. On a CDN with per-URL purging, these are the paths to purge. A path covers every query string.
