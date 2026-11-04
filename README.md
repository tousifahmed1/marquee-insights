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
- [Ask the data](docs/ask-the-data.md): text to SQL, validation, caching, budgets, evaluation
- [Running on GCP](docs/gcp.md): Cloud Run, Cloud CDN and Cloud SQL design
- [Working with Claude Code](docs/claude-code.md)
- `CLAUDE.md`: commands, folder layout and the rules every change follows

## Ask the data

`/ask` turns a plain-English question into one SQL `SELECT`, runs it read-only, and shows the answer with the query beside it. The full design is in [docs/ask-the-data.md](docs/ask-the-data.md); the short version:

- **Text to SQL, not RAG.** The questions are numeric ("which platform has the highest intent among 18 to 34 year olds"), so the right answer is a computation over all 50,000 rows, not a passage retrieved from a document. The model writes the query and Postgres does the arithmetic.
- **One model call per question.** The model returns one JSON object: `answerable`, `sql`, an `answer_template` with `{column}` placeholders, a chart hint and a reason. The template is filled from the first result row, so every number in an answer comes from the database and the model is never called a second time to write the sentence.
- **Caching and pre-warming.** Answers (and refusals) are cached in Workers KV under the normalised question's hash and a data version, with no expiry. A hit costs zero model calls. `pnpm warm:ask` runs the six example questions after a deploy so the example buttons are always cache hits; `pnpm warm:ask --reset` after a reseed.
- **Turnstile and budgets.** Cloudflare Turnstile is verified before any model call; cached answers and examples skip it. Each IP gets 5 new questions an hour, and the whole site 250 model calls a UTC day, counted in KV. `GET /api/ask/status` (admin header) shows the day's calls per provider, cache hits and the remaining budget.
- **Provider fallback.** Gemini 3.5 Flash-Lite answers first through the official SDK; on a 429 or quota error it is marked exhausted in KV (until the next UTC midnight, or for the short retry delay of a per-minute limit) and Groq's `openai/gpt-oss-120b` takes over. Both exhausted means an "out of capacity" message, with no call made.
- **Validation layers.** The SQL is parsed with node-sql-parser in Postgres mode and walked deny-by-default: one `SELECT`, only the two tables and their real columns, an allowlist of functions and operators, no comments, catalogs, set operations, `WITH` or window functions, `LIMIT 100` added unless the result is one aggregate row. What runs is the checked tree printed back. One retry with the rejection reason, budget permitting.
- **Read-only role.** Queries run as `ask_readonly`, which can only `SELECT` from `shows` and `responses`, inside a `READ ONLY` transaction with a 3 second statement timeout.
- **Evaluation.** `pnpm eval:ask` runs 20 questions with reference SQL plus 4 refusals through the real pipeline. Gemini 3.5 Flash-Lite: 20/20 answerable, 4/4 refused, 2.8 s a question. Groq gpt-oss-120b: 20/20, 4/4, 2.1 s.

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
| `DATABASE_URL_READONLY` | No | Neon connection string for the `ask_readonly` role, used only by Ask the data |
| `GEMINI_API_KEY`, `GROQ_API_KEY` | No | Ask the data models (Gemini first, Groq as the fallback) |
| `ASK_ADMIN_SECRET` | No | Header secret for `pnpm warm:ask` and the Ask the data status endpoint |
| `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Site key yes, secret no | Cloudflare Turnstile on the Ask the data form |
| `VITE_SITE_URL` | Yes | Canonical URLs and the sitemap (defaults to the workers.dev URL) |

`pnpm verify` runs typecheck, lint, unit tests and the Playwright suite. `pnpm deploy` builds and deploys. `pnpm check:prod` checks every route on the live site afterwards, and `pnpm warm:ask` fills the Ask the data cache.

Upload the secrets to the Worker from `.env` in one go:

```bash
node -e "process.loadEnvFile('.env');const k=['DATABASE_URL','DATABASE_URL_READONLY','SANITY_READ_TOKEN','SANITY_PREVIEW_SECRET','SANITY_WEBHOOK_SECRET','GEMINI_API_KEY','GROQ_API_KEY','ASK_ADMIN_SECRET','TURNSTILE_SECRET_KEY'];process.stdout.write(JSON.stringify(Object.fromEntries(k.map(x=>[x,process.env[x]]))))" | pnpm wrangler secret bulk
```
