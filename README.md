# Marquee Insights

Marketing site and data explorer for a fictional entertainment audience research company. See `CLAUDE.md` for the stack, folder layout and project rules.

```bash
pnpm install
pnpm dev
```

## Publish webhook

Rendered pages are cached in Workers KV. Publishing in Sanity calls `POST /api/revalidate`, which bumps the content version so every cached page renders again on its next request. Set it up once in the Sanity dashboard:

1. Generate a secret (`openssl rand -hex 32`), add it to `.env` as `SANITY_WEBHOOK_SECRET` and to the Worker with `pnpm wrangler secret put SANITY_WEBHOOK_SECRET`.
2. Open [sanity.io/manage](https://www.sanity.io/manage), pick the project, then **API → Webhooks → Create webhook**.
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
4. Save. Publish any change and check the webhook's **Attempts log** for a `200`.

The endpoint rejects calls without a valid `sanity-webhook-signature` header. Test it with `pnpm webhook:test <site-url>`, which signs a sample payload with the secret from `.env`.

Each call also logs the document and the URLs it affects (`pnpm wrangler tail`). These come from `affectedUrls()` in `src/lib/purge-map.ts`: a report affects its own page, `/reports`, `/` and `/sitemap.xml`; a page affects its own path and `/sitemap.xml`; a redirect affects its source path; site settings affect everything. On a CDN with per-URL purging, those are the URLs to purge instead of bumping a version.
