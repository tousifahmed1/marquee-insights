# Ask the data

A visitor asks a question in plain English, a model turns it into one SQL `SELECT`, the validator checks it, it runs read-only on Neon, and the page shows the answer with the SQL beside it. Everything lives in `src/data/ask`.

## Models

| Role | Provider | Model | Why |
|---|---|---|---|
| Primary | Google Gemini, through `@google/genai` | `gemini-3.5-flash-lite` | Free of charge with the roomiest free daily quota (reported 500 requests a day against 20 for 3.8 Flash) |
| Fallback | Groq, through its OpenAI-compatible API | `openai/gpt-oss-120b` | Free tier with a separate daily quota |

`generate()` in `src/data/ask/llm.ts` is the only place a model is called. It tries Gemini first. A 429 or quota error marks that provider exhausted in KV (`ask:exhausted:<provider>`) and the next provider answers. The mark lasts until the next UTC midnight, or for the retry delay the provider asked for when that is under an hour, so a per-minute limit does not knock a provider out for the day. With every provider exhausted the result is out-of-capacity and nothing is called. Output is capped at 800 tokens and every call is aborted after 15 seconds.

## Read-only role

Every query from this feature runs on the `ask_readonly` role, inside a `READ ONLY` transaction, with `SET LOCAL statement_timeout = '3s'`. The role itself also carries the timeout and read-only defaults, so the limits hold even if the code is wrong.

Run this once in the Neon SQL Editor as `neondb_owner`, with a password from `openssl rand -base64 24`:

```sql
create role ask_readonly with login password 'REPLACE_ME';
grant connect on database neondb to ask_readonly;
grant usage on schema public to ask_readonly;
revoke create on schema public from ask_readonly;
grant select on table public.shows, public.responses to ask_readonly;
alter role ask_readonly set statement_timeout = '3s';
alter role ask_readonly set default_transaction_read_only = on;
alter role ask_readonly set search_path = public;
```

The role can read nothing else: no other tables, no `drizzle` schema, no `CREATE`. Postgres lets every role read `pg_catalog` and `information_schema`, which is why the validator rejects system catalogs. `pnpm seed` truncates rather than drops the tables, so the grants survive a reseed; a migration that creates a new table does not grant it to this role, which is the point.

Then set `DATABASE_URL_READONLY` to the same pooled host as `DATABASE_URL` with the new user:

```
postgresql://ask_readonly:<password>@<pooled host>/neondb?sslmode=require
```

## Secrets

`GEMINI_API_KEY`, `GROQ_API_KEY` and `DATABASE_URL_READONLY` are read with `serverSecret()` like every other secret: from `.env` locally and from Worker secrets in production (the `wrangler secret bulk` command in the README uploads them). Cached answers, exhaustion marks and counters live in the `ASK_CACHE` KV namespace, separate from the page cache.
